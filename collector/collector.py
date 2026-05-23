import platform
import psutil
import wmi
import json
import uuid
from datetime import datetime
import os

def get_install_date(c):
    try:
        os_info = c.Win32_OperatingSystem()[0]
        install_date_str = os_info.InstallDate
        # Format: 20230510103025.000000-240
        dt = datetime.strptime(install_date_str.split('.')[0], '%Y%m%d%H%M%S')
        return dt.strftime('%Y-%m-%d')
    except Exception as e:
        return str(e)

def get_mac_address():
    mac_node = uuid.getnode()
    mac = ':'.join(['{:02x}'.format((mac_node >> elements) & 0xff) for elements in range(0,8*6,8)][::-1])
    return mac

def collect_data():
    print("Iniciando recoleccion de datos del sistema...")
    try:
        c = wmi.WMI()
    except Exception as e:
        print(f"Error al inicializar WMI: {e}")
        print("Asegurese de estar ejecutando este script en Windows.")
        return

    # Procesador
    try:
        processor = c.Win32_Processor()[0].Name.strip()
    except:
        processor = platform.processor()

    # RAM en GB
    ram_gb = round(psutil.virtual_memory().total / (1024.0 ** 3), 2)

    # Tipo de RAM
    tipo_ram = "Desconocido"
    try:
        # 20=DDR, 21=DDR2, 24=DDR3, 26=DDR4, 34=DDR5
        ram_types = {20: "DDR", 21: "DDR2", 24: "DDR3", 26: "DDR4", 34: "DDR5"}
        mem_info = c.Win32_PhysicalMemory()
        if mem_info:
            smbios_type = mem_info[0].SMBIOSMemoryType
            tipo_ram = ram_types.get(int(smbios_type), f"Tipo {smbios_type}")
    except Exception:
        pass

    # Almacenamiento (Disco Principal o todos los discos)
    tipo_disco = "Desconocido (OS Legacy)"
    try:
        c_storage = wmi.WMI(namespace="root\\Microsoft\\Windows\\Storage")
        disks = c_storage.MSFT_PhysicalDisk()
        if disks:
            # Evaluamos el primer disco
            disk = disks[0]
            media_type = "SSD" if disk.MediaType == 4 else ("HDD" if disk.MediaType == 3 else "Desc")
            bus_type = "NVMe" if disk.BusType == 17 else ("SATA" if disk.BusType == 11 else ("USB" if disk.BusType == 7 else "Desc"))
            tipo_disco = f"{media_type}-{bus_type}"
    except Exception:
        pass

    try:
        # Sumamos el tamaño de todos los discos fisicos usando WMI
        total_disk_bytes = sum(int(disk.Size) for disk in c.Win32_DiskDrive() if disk.Size)
        storage_gb = round(total_disk_bytes / (1024.0 ** 3), 2)
    except:
        # Fallback a psutil
        storage_gb = round(psutil.disk_usage('/').total / (1024.0 ** 3), 2)

    # Fecha de Instalacion
    install_date = get_install_date(c)

    # Identificadores
    hostname = platform.node()
    mac = get_mac_address()

    # Ubicacion (Nula / No Asignada)
    location = None

    data = {
        "hostname": hostname,
        "mac_address": mac,
        "processor": processor,
        "ram_gb": ram_gb,
        "tipo_ram": tipo_ram,
        "storage_gb": storage_gb,
        "tipo_disco": tipo_disco,
        "install_date": install_date,
        "location": location
    }

    output_filename = f"{hostname}_inventory.json"
    with open(output_filename, 'w') as f:
        json.dump(data, f, indent=4)

    print(f"\nDatos recolectados exitosamente.")
    print(f"Archivo generado: {output_filename}")
    print(json.dumps(data, indent=4))

if __name__ == "__main__":
    collect_data()
