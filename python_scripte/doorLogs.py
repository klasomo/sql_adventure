import random
import datetime

def generate_door_logs(num_employees):
    door_logs = {}

    # Arbeitsbeginn
    for employee_id in range(num_employees):
        entry_time = randomize_time(datetime.time(8, 0, 0), 120)
        door_logs["Haupteingang"] = door_logs.get("Haupteingang", []) + [(employee_id + 1, entry_time, "Eintritt")]

    # Mittagessen
    for employee_id in range(num_employees):
        exit_time = randomize_time(datetime.time(11, 0, 0), 60, "positive")
        return_time = randomize_time(datetime.datetime.strptime(exit_time, "%H:%M:%S").time(), 60, "positive")
        door_logs["Haupteingang"] = door_logs.get("Haupteingang", []) + [(employee_id + 1, exit_time, "Austritt")]
        door_logs["Haupteingang"] = door_logs.get("Haupteingang", []) + [(employee_id + 1, return_time, "Eintritt")]

    # Feierabend
    for employee_id in range(num_employees):
        exit_time = randomize_time(datetime.time(16, 0, 0), 120)
        door_logs["Haupteingang"] = door_logs.get("Haupteingang", []) + [(employee_id + 1, exit_time, "Austritt")]

    return door_logs

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

    door_logs = generate_door_logs(num_employees)

    # Ausgabe der Tür-Log-Daten
    print("MitarbeiterId,Uhrzeit,TürName,Aktion")
    for door_name, logs in door_logs.items():
        for entry in logs:
            print(f"{entry[0]},{entry[1]},{door_name},{entry[2]}")

if __name__ == "__main__":
    main()
