import platform
import psutil
import wmi
import json
import uuid
from datetime import datetime
import os
import winreg

def get_install_date(c):
    try:
        os_info = c.Win32_OperatingSystem()[0]
        install_date_str = os_info.InstallDate
        dt = datetime.strptime(install_date_str.split('.')[0], '%Y%m%d%H%M%S')
        return dt.strftime('%Y-%m-%d')
    except Exception as e:
        return str(e)

def get_mac_address():
    mac_node = uuid.getnode()
    mac = ':'.join(['{:02x}'.format((mac_node >> elements) & 0xff) for elements in range(0,8*6,8)][::-1])
    return mac

def get_installed_programs():
    programs = []
    keys = [
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall"),
        (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"),
        (winreg.HKEY_CURRENT_USER, r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall")
    ]
    
    for hkey, subkey in keys:
        try:
            key = winreg.OpenKey(hkey, subkey)
            for i in range(0, winreg.QueryInfoKey(key)[0]):
                try:
                    skey_name = winreg.EnumKey(key, i)
                    skey = winreg.OpenKey(key, skey_name)
                    try:
                        name = winreg.QueryValueEx(skey, "DisplayName")[0]
                        version = ""
                        try:
                            version = winreg.QueryValueEx(skey, "DisplayVersion")[0]
                        except OSError:
                            pass
                        date_str = ""
                        try:
                            date_raw = winreg.QueryValueEx(skey, "InstallDate")[0]
                            if len(str(date_raw)) == 8:
                                date_str = f"{str(date_raw)[:4]}-{str(date_raw)[4:6]}-{str(date_raw)[6:]}"
                            else:
                                date_str = str(date_raw)
                        except OSError:
                            pass
                        
                        if not date_str:
                            try:
                                loc = winreg.QueryValueEx(skey, "InstallLocation")[0]
                                if loc and os.path.exists(str(loc)):
                                    import datetime
                                    ctime = os.path.getctime(str(loc))
                                    date_str = datetime.datetime.fromtimestamp(ctime).strftime('%Y-%m-%d')
                            except Exception:
                                pass
                        
                        if name:
                            programs.append({"nombre": str(name).strip(), "version": str(version).strip(), "fecha_instalacion": str(date_str).strip()})
                    except OSError:
                        pass
                    finally:
                        skey.Close()
                except OSError:
                    pass
        except OSError:
            pass
            
    # Remove duplicates
    unique_programs = []
    seen = set()
    for p in programs:
        identifier = f"{p['nombre']}_{p['version']}"
        if identifier not in seen:
            seen.add(identifier)
            unique_programs.append(p)
            
    return sorted(unique_programs, key=lambda x: x['nombre'].lower())

def get_extra_hardware(c):
    hw = []
    try:
        for v in c.Win32_VideoController():
            if v.Name: hw.append({"tipo": "GPU", "modelo": v.Name})
    except: pass
    
    try:
        for a in c.Win32_SoundDevice():
            if a.Name: hw.append({"tipo": "Audio", "modelo": a.Name})
    except: pass
    
    try:
        for n in c.Win32_NetworkAdapter():
            name_str = str(n.Name)
            if 'Wi-Fi' in name_str or 'Wireless' in name_str or '802.11' in name_str:
                hw.append({"tipo": "Red Inalámbrica (Wi-Fi)", "modelo": name_str})
            elif 'Ethernet' in name_str or 'Gigabit' in name_str or 'PCIe' in name_str or 'GbE' in name_str:
                if 'Virtual' not in name_str and 'VMware' not in name_str and 'Bluetooth' not in name_str:
                    hw.append({"tipo": "Red Cableada (Ethernet)", "modelo": name_str})
    except: pass
    
    return hw

def collect_data():
    print("==========================================")
    print("   Inventario de Hardware y Software")
    print("==========================================")
    alias = input("Ingrese un alias para este equipo (ej. PC-Secretaria) o presione Enter para omitir: ").strip()

    print("\nIniciando recoleccion de datos del sistema...")
    try:
        c = wmi.WMI()
    except Exception as e:
        print(f"Error al inicializar WMI: {e}")
        return

    try:
        processor = c.Win32_Processor()[0].Name.strip()
    except:
        processor = platform.processor()

    ram_gb = round(psutil.virtual_memory().total / (1024.0 ** 3), 2)

    tipo_ram = "Desconocido"
    try:
        ram_types = {20: "DDR", 21: "DDR2", 24: "DDR3", 26: "DDR4", 34: "DDR5"}
        mem_info = c.Win32_PhysicalMemory()
        if mem_info:
            smbios_type = mem_info[0].SMBIOSMemoryType
            tipo_ram = ram_types.get(int(smbios_type), f"Tipo {smbios_type}")
    except Exception:
        pass

    tipo_disco = "Desconocido (OS Legacy)"
    discos_detalle = []
    try:
        c_storage = wmi.WMI(namespace="root\\Microsoft\\Windows\\Storage")
        disks = c_storage.MSFT_PhysicalDisk()
        if disks:
            disk0 = disks[0]
            media_type0 = "SSD" if disk0.MediaType == 4 else ("HDD" if disk0.MediaType == 3 else "Desc")
            bus_type0 = "NVMe" if disk0.BusType == 17 else ("SATA" if disk0.BusType == 11 else ("USB" if disk0.BusType == 7 else "Desc"))
            tipo_disco = f"{media_type0}-{bus_type0}"

            for d in disks:
                media_t = "SSD" if d.MediaType == 4 else ("HDD" if d.MediaType == 3 else "Desconocido")
                bus_t = "NVMe" if d.BusType == 17 else ("SATA" if d.BusType == 11 else ("USB" if d.BusType == 7 else "Desconocido"))
                size_gb = round(int(d.Size) / (1024.0 ** 3), 2) if d.Size else 0.0
                discos_detalle.append({
                    "modelo": str(d.FriendlyName).strip(),
                    "capacidad_gb": size_gb,
                    "tipo": f"{media_t}-{bus_t}"
                })
    except Exception:
        pass

    try:
        total_disk_bytes = sum(int(disk.Size) for disk in c.Win32_DiskDrive() if disk.Size)
        storage_gb = round(total_disk_bytes / (1024.0 ** 3), 2)
    except:
        storage_gb = round(psutil.disk_usage('/').total / (1024.0 ** 3), 2)

    install_date = get_install_date(c)
    os_version = f"{platform.system()} {platform.release()}"
    hostname = platform.node()
    mac = get_mac_address()
    location = None
    
    print("Recolectando hardware adicional...")
    hardware_extra = get_extra_hardware(c)
    
    print("Recolectando programas instalados (puede tardar unos segundos)...")
    programas = get_installed_programs()

    data = {
        "hostname": hostname,
        "alias": alias if alias else None,
        "os_version": os_version,
        "mac_address": mac,
        "processor": processor,
        "ram_gb": ram_gb,
        "tipo_ram": tipo_ram,
        "storage_gb": storage_gb,
        "tipo_disco": tipo_disco,
        "discos_detalle": discos_detalle,
        "hardware_extra": hardware_extra,
        "programas": programas,
        "install_date": install_date,
        "location": location
    }

    output_filename = f"{hostname}_inventory.json"
    with open(output_filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

    print(f"\nDatos recolectados exitosamente.")
    print(f"Archivo generado: {output_filename}")

if __name__ == "__main__":
    collect_data()
