import json
import re

# Коэффициенты масштабирования
SCALE_X = 1.8 #1928 / 800  # 2.41
SCALE_Y = 2.41 #1080 / 600  # 1.8

input_file = "polygons.js"
output_file = "polygons2.js"

print(f"Читаем {input_file}...")
with open(input_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Извлекаем JSON-часть (все, что внутри фигурных скобок после const LOCATIONS = )
match = re.search(r'const\s+LOCATIONS\s*=\s*({.*});?\s*$', content, re.DOTALL)
if not match:
    print("ОШИБКА: Не удалось найти 'const LOCATIONS = {...}' в файле!")
    print("Убедитесь, что файл имеет правильный формат.")
    exit()

json_str = match.group(1)

try:
    data = json.loads(json_str)
except json.JSONDecodeError as e:
    print(f"ОШИБКА парсинга JSON: {e}")
    exit()

# Масштабируем координаты
scaled_count = 0
for loc_id, loc_data in data.items():
    if "zones" in loc_data:
        for zone in loc_data["zones"]:
            # Масштабируем мировые координаты (которые использует JS для коллизий)
            if "polygon_world_flat" in zone:
                for point in zone["polygon_world_flat"]:
                    point["x"] = round(point["x"] * SCALE_X, 3)
                    point["y"] = round(point["y"] * SCALE_Y, 3)
                    scaled_count += 1
            
            # На всякий случай масштабируем и пиксельные (если вдруг используете для отладки)
            if "polygon_pixel" in zone:
                for point in zone["polygon_pixel"]:
                    point["x"] = round(point["x"] * SCALE_X, 3)
                    point["y"] = round(point["y"] * SCALE_Y, 3)

# Формируем новый JS-файл
new_json_str = json.dumps(data, indent=4, ensure_ascii=False)
new_content = f"const LOCATIONS = {new_json_str};\n"

with open(output_file, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"✅ Готово! Масштабировано {scaled_count} точек.")
print(f"   Коэффициенты: X = {SCALE_X:.2f}, Y = {SCALE_Y:.2f}")
print(f"   Файл {output_file} обновлен.")