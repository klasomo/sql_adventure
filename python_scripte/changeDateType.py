import os
import csv
import re

def convert_date_format(input_folder):
    # Regular expression to match MM/DD/YYYY format
    date_pattern = r'(\d{1,2})/(\d{1,2})/(\d{4})'

    # Create a fixed folder next to the input folder
    output_folder = f"{input_folder}_fixed"
    os.makedirs(output_folder, exist_ok=True)

    for filename in os.listdir(input_folder):
        if filename.endswith('.csv'):
            input_path = os.path.join(input_folder, filename)
            output_path = os.path.join(output_folder, filename)

            with open(input_path, 'r', newline='') as infile, \
                 open(output_path, 'w', newline='') as outfile:

                reader = csv.reader(infile)
                writer = csv.writer(outfile)

                for row in reader:
                    converted_row = []
                    for cell in row:
                        # Find all occurrences of MM/DD/YYYY in the cell
                        matches = re.findall(date_pattern, cell)
                        for match in matches:
                            # Reformat each found date from MM/DD/YYYY to DD.MM.YYYY
                            converted_date = f'{match[1]}.{match[0]}.{match[2]}'
                            cell = cell.replace(f'{match[0]}/{match[1]}/{match[2]}', converted_date)
                        converted_row.append(cell)
                    writer.writerow(converted_row)

            print(f'Converted {filename} and saved to {output_path}')

    print(f'All files converted. Fixed files saved in {output_folder}')

# Beispielaufruf des Skripts
if __name__ == '__main__':
    input_folder = input('Bitte geben Sie den Pfad zum Ordner mit den CSV-Dateien an: ')
    convert_date_format(input_folder)
