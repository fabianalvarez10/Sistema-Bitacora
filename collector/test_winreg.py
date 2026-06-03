import winreg
import json

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
                skey_name = winreg.EnumKey(key, i)
                skey = winreg.OpenKey(key, skey_name)
                try:
                    name = winreg.QueryValueEx(skey, "DisplayName")[0]
                    version = ""
                    try:
                        version = winreg.QueryValueEx(skey, "DisplayVersion")[0]
                    except OSError:
                        pass
                    date = ""
                    try:
                        date = winreg.QueryValueEx(skey, "InstallDate")[0]
                    except OSError:
                        pass
                    
                    if name:
                        programs.append({"nombre": str(name).strip(), "version": str(version).strip(), "fecha": str(date).strip()})
                except OSError:
                    pass
                finally:
                    skey.Close()
        except OSError:
            pass
            
    return programs

print(json.dumps(get_installed_programs()[:5], indent=4))
