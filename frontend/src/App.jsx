import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Button, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip, Card, CardBody, Accordion, AccordionItem, Select, SelectItem
} from '@nextui-org/react';
import { QRCodeSVG } from 'qrcode.react';
import { Upload, QrCode, Monitor, Server, Cpu, HardDrive, Settings, MemoryStick, LayoutDashboard } from 'lucide-react';
import ZonaManager from './components/ZonaManager';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function App() {
  const [computers, setComputers] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [locationTab, setLocationTab] = useState('unassigned');
  const [selectedComputer, setSelectedComputer] = useState(null);
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const fileInputRef = useRef(null);
  const qrRef = useRef(null);

  const fetchZonas = async () => {
    try {
      const response = await axios.get(`${API_URL}/zonas/`);
      setZonas(response.data);
    } catch (error) {
      console.error("Error fetching zonas:", error);
    }
  };

  const fetchComputers = async (tab) => {
    try {
      let url = `${API_URL}/computers/`;
      if (tab === 'unassigned') {
        url += `?unassigned=true`;
      } else if (tab !== 'manage') {
        url += `?zona=${tab}`;
      }
      const response = await axios.get(url);
      setComputers(response.data);
    } catch (error) {
      console.error("Error fetching computers:", error);
    }
  };

  useEffect(() => {
    fetchZonas();
  }, []);

  useEffect(() => {
    if (locationTab !== 'manage') {
      fetchComputers(locationTab);
    }
  }, [locationTab, zonas]); // Re-fetch computers if zones change or tab changes

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/upload-inventory/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Inventario subido exitosamente! Lo encontrarás en "Sin Asignar".');
      fetchComputers(locationTab);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert('Error al subir el archivo.');
    }
    e.target.value = null; // Reset input
  };

  const handleAssignZone = async (computerId, zonaId) => {
    try {
      await axios.patch(`${API_URL}/computers/${computerId}/zona/`, {
        zona_id: zonaId === 'none' ? null : zonaId
      });
      fetchComputers(locationTab);
    } catch (error) {
      console.error("Error assigning zone:", error);
      alert("Error al asignar zona.");
    }
  };

  const handleGenerateQR = (computer, e) => {
    if(e) e.stopPropagation();
    setSelectedComputer(computer);
    onOpen();
  };

  const handleDownloadQR = () => {
    const canvas = qrRef.current.querySelector('svg');
    if (!canvas) return;
    
    const svgData = new XMLSerializer().serializeToString(canvas);
    const blob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${selectedComputer.hostname}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getQRDataString = (comp) => {
    if (!comp) return '';
    return `ID: ${comp.hostname}\nMAC: ${comp.mac_address}\nCPU: ${comp.processor}\nRAM: ${comp.ram_gb}GB (${comp.tipo_ram})\nDisco: ${comp.storage_gb}GB (${comp.tipo_disco})\nZona: ${comp.zona_nombre || 'No Asignada'}`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-700">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 flex items-center gap-2">
            <Server className="text-blue-400" size={32} />
            Inventario Hardware VPDS
          </h1>
          <p className="text-slate-400 mt-1">Sistema de gestión de recursos tecnológicos de la universidad</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <Button 
            color="primary" 
            startContent={<Upload size={18} />}
            onClick={() => fileInputRef.current.click()}
            className="font-medium shadow-md shadow-blue-500/20"
          >
            Importar JSON
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <Card className="bg-slate-800/50 border border-slate-700/50 shadow-xl min-h-[500px]">
        <CardBody className="gap-6 p-6">
          <Tabs 
            aria-label="Ubicaciones" 
            color="primary" 
            variant="underlined"
            selectedKey={locationTab}
            onSelectionChange={setLocationTab}
            classNames={{
              tabList: "gap-6 relative rounded-none p-0 border-b border-divider flex-wrap",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            <Tab key="unassigned" title={
              <div className="flex items-center space-x-2">
                <LayoutDashboard size={18} />
                <span>Sin Asignar</span>
              </div>
            }/>
            {zonas.map(zona => (
              <Tab key={zona.id} title={
                <div className="flex items-center space-x-2">
                  <Monitor size={18} />
                  <span>{zona.nombre}</span>
                </div>
              }/>
            ))}
            <Tab key="manage" title={
              <div className="flex items-center space-x-2 text-warning">
                <Settings size={18} />
                <span>Gestionar Zonas</span>
              </div>
            }/>
          </Tabs>

          <div className="mt-4">
            {locationTab === 'manage' ? (
              <ZonaManager zonas={zonas} onZonasChange={fetchZonas} />
            ) : (
              <>
                {computers.length === 0 ? (
                  <div className="text-center text-slate-500 py-10">
                    No hay equipos en esta vista.
                  </div>
                ) : (
                  <Accordion variant="splitted">
                    {computers.map(comp => (
                      <AccordionItem 
                        key={comp.id} 
                        aria-label={comp.hostname}
                        classNames={{
                          base: "bg-slate-800 border border-slate-700 shadow-md",
                          title: "text-slate-200",
                          content: "text-slate-300 px-4 pb-4"
                        }}
                        title={
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-lg">{comp.hostname}</span>
                              <span className="text-xs text-slate-500 font-mono">{comp.mac_address}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <Chip size="sm" variant="flat" color={comp.zona_nombre ? "primary" : "warning"}>
                                {comp.zona_nombre || "Sin Asignar"}
                              </Chip>
                              <Button 
                                isIconOnly 
                                color="secondary" 
                                variant="flat" 
                                size="sm"
                                aria-label="Generar QR"
                                onClick={(e) => handleGenerateQR(comp, e)}
                              >
                                <QrCode size={16} />
                              </Button>
                            </div>
                          </div>
                        }
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-slate-700">
                          {/* Procesador */}
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500 font-semibold uppercase flex items-center gap-1"><Cpu size={14}/> Procesador</span>
                            <span className="text-sm font-medium">{comp.processor}</span>
                          </div>

                          {/* RAM */}
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500 font-semibold uppercase flex items-center gap-1"><MemoryStick size={14}/> Memoria RAM</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{comp.ram_gb} GB</span>
                              <Chip size="sm" color="default" variant="bordered" className="text-xs border-slate-600">{comp.tipo_ram}</Chip>
                            </div>
                          </div>

                          {/* Almacenamiento */}
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500 font-semibold uppercase flex items-center gap-1"><HardDrive size={14}/> Almacenamiento</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{comp.storage_gb} GB</span>
                              <Chip size="sm" color="default" variant="bordered" className="text-xs border-slate-600">{comp.tipo_disco}</Chip>
                            </div>
                          </div>

                          {/* Asignación */}
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500 font-semibold uppercase flex items-center gap-1"><Settings size={14}/> Asignar a Zona</span>
                            <Select 
                              size="sm"
                              placeholder="Seleccionar zona" 
                              selectedKeys={[comp.zona ? comp.zona.toString() : 'none']}
                              onChange={(e) => handleAssignZone(comp.id, e.target.value)}
                              classNames={{ trigger: "bg-slate-900 border border-slate-700" }}
                            >
                              <SelectItem key="none" value="none">Sin Asignar</SelectItem>
                              {zonas.map(z => (
                                <SelectItem key={z.id.toString()} value={z.id.toString()}>{z.nombre}</SelectItem>
                              ))}
                            </Select>
                          </div>
                          
                          <div className="col-span-full mt-2">
                             <span className="text-xs text-slate-500">Instalación OS: {comp.install_date}</span>
                          </div>
                        </div>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* QR Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent className="bg-slate-900 border border-slate-700">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-slate-100">
                Código QR del Equipo
                <span className="text-sm font-normal text-slate-400">
                  {selectedComputer?.hostname} - {selectedComputer?.zona_nombre || 'Sin Asignar'}
                </span>
              </ModalHeader>
              <ModalBody className="flex flex-col items-center py-6">
                <div className="bg-white p-4 rounded-xl shadow-xl" ref={qrRef}>
                  <QRCodeSVG 
                    value={getQRDataString(selectedComputer)} 
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-sm text-slate-400 mt-4 text-center px-4">
                  Escanea este código para acceder a las especificaciones técnicas del equipo.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cerrar
                </Button>
                <Button color="success" onPress={handleDownloadQR} className="text-white">
                  Descargar SVG
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

export default App;
