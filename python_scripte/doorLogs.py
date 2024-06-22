import random
import datetime
import csv
import os

def generate_door_logs(num_employees, doors, current_date):
    door_logs = {door: [] for door in doors}

    # Arbeitsbeginn
    for employee_id in range(num_employees):
        entry_time = randomize_time(datetime.time(8, 0, 0), 120)
        door_logs["Haupteingang"].append((current_date, entry_time, "Haupteingang", employee_id + 1))

    # Mittagessen
    for employee_id in range(num_employees):
        exit_time = randomize_time(datetime.time(11, 0, 0), 60, "positive")
        exit_time_obj = datetime.datetime.strptime(exit_time, "%H:%M:%S").time()
        return_time = randomize_time(exit_time_obj, 60, "positive")
        door_logs["Haupteingang"].append((current_date, exit_time, "Haupteingang", employee_id + 1))
        door_logs["Haupteingang"].append((current_date, return_time, "Haupteingang", employee_id + 1))

        # Zufällig eine andere Tür nutzen nach der Mittagspause
        if len(doors) > 1:
            random_door = random.choice(doors[1:])  # Zufällige Tür auswählen, außer dem Haupteingang
            door_logs[random_door].append((current_date, return_time, random_door, employee_id + 1))

    # Feierabend
    for employee_id in range(num_employees):
        exit_time = randomize_time(datetime.time(16, 0, 0), 120)
        door_logs["Haupteingang"].append((current_date, exit_time, "Haupteingang", employee_id + 1))

    # Zufällige Türnutzung während des Tages
    for employee_id in range(num_employees):
        for _ in range(random.randint(1, 3)):  # Jeder Mitarbeiter benutzt 1 bis 3 Mal eine andere Tür
            random_time = randomize_time(datetime.time(random.randint(9, 15), random.randint(0, 59), 0), 30)
            random_door = random.choice(doors[1:])  # Zufällige Tür auswählen, außer dem Haupteingang
            door_logs[random_door].append((current_date, random_time, random_door, employee_id + 1))

    return door_logs

def generate_additional_logs(room_name, employee_id, count, current_date, doors, all_door_logs):
    for _ in range(count):
        random_time = randomize_time(datetime.time(random.randint(8, 17), random.randint(0, 59), 0), 30)
        door_logs = {door: [] for door in doors}
        door_logs[room_name].append((current_date, random_time, room_name, employee_id))
        all_door_logs.append(door_logs[room_name])

def randomize_time(base_time, range_minutes=0, direction='both'):
    base_seconds = base_time.hour * 3600 + base_time.minute * 60 + base_time.second
    
    if direction == 'positive':
        randomized_seconds = base_seconds + random.randint(0, range_minutes * 60)
    elif direction == 'negative':
        randomized_seconds = base_seconds - random.randint(0, range_minutes * 60)
    else:
        randomized_seconds = base_seconds + random.randint(-range_minutes * 60, range_minutes * 60)
        
    randomized_seconds = max(0, min(86400, randomized_seconds))  # Ensure the time is within a day (24 hours)
    randomized_time = datetime.time(randomized_seconds // 3600, (randomized_seconds // 60) % 60, randomized_seconds % 60)
    
    return randomized_time.strftime("%H:%M:%S")

def main():
    num_employees = int(input("Bitte geben Sie die Anzahl der Mitarbeiter ein: "))
    doors = [
        "Haupteingang",
        "101", "102", "201", "202", "203", "204", "301", "302", "303", 
        "401", "402", "404"
    ]

    # Beispiel-Datumsarray
    dates = [
        "06/27/2024",
    ]

    all_door_logs = []

    # Für jedes Datum in der Liste generate_door_logs aufrufen und Ergebnisse sammeln
    for date in dates:
        door_logs = generate_door_logs(num_employees, doors, date)
        all_door_logs.extend(door_logs.values())

    # Generieren zusätzlicher Logs für einen Raumnamen und eine Mitarbeiter-ID
    room_name = "404"  # Beispielraumname
    employee_id = 28  # Beispiel-Mitarbeiter-ID
    count = 27  # Anzahl der zusätzlichen Logs
    generate_additional_logs(room_name, employee_id, count, dates[0], doors, all_door_logs)

    # Tür-Logs mischen
    random.shuffle(all_door_logs)

    # Ausgabe der gemischten Tür-Log-Daten mit aufsteigender ID
    csv_filename = "Türprotokoll.csv"
    csv_filepath = os.path.join(os.getcwd(), csv_filename)

    with open(csv_filepath, mode='w', newline='', encoding='utf-8') as csv_file:
        fieldnames = ['id', 'Datum', 'Uhrzeit', 'Tür_id', 'Mitarbeiter_Id']
        writer = csv.DictWriter(csv_file, fieldnames=fieldnames)

        writer.writeheader()
        idx = 1
        for logs in all_door_logs:
            for entry in logs:
                writer.writerow({'id': idx, 'Datum': entry[0], 'Uhrzeit': entry[1], 'Tür_id': entry[2], 'Mitarbeiter_Id': entry[3]})
                idx += 1

    print(f"Das Türprotokoll wurde unter '{csv_filepath}' gespeichert.")

if __name__ == "__main__":
    main()
