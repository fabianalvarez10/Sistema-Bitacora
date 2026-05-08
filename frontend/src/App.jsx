import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Button, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip, Card, CardBody
} from '@nextui-org/react';
import { QRCodeSVG } from 'qrcode.react';
import { Upload, QrCode, Monitor, Server, Cpu, HardDrive } from 'lucide-react';
import './App.css';

const API_URL = 'http://localhost:8000/api';

function App() {
  const [computers, setComputers] = useState([]);
  const [location, setLocation] = useState('Laboratorios de Informática');
  const [selectedComputer, setSelectedComputer] = useState(null);
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const fileInputRef = useRef(null);
  const qrRef = useRef(null);

  const fetchComputers = async (loc) => {
    try {
      const response = await axios.get(`${API_URL}/computers/?location=${loc}`);
      setComputers(response.data);
    } catch (error) {
      console.error("Error fetching computers:", error);
    }
  };

  useEffect(() => {
    fetchComputers(location);
  }, [location]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post(`${API_URL}/upload-inventory/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Inventario subido exitosamente!');
      fetchComputers(location);
    } catch (error) {
      console.error("Error uploading file:", error);
      alert('Error al subir el archivo.');
    }
  };

  const handleGenerateQR = (computer) => {
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
    return `ID: ${comp.hostname}\nMAC: ${comp.mac_address}\nCPU: ${comp.processor}\nRAM: ${comp.ram_gb}GB\nDisco: ${comp.storage_gb}GB\nUbicación: ${comp.location}`;
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
      <Card className="bg-slate-800/50 border border-slate-700/50 shadow-xl">
        <CardBody className="gap-6 p-6">
          <Tabs 
            aria-label="Ubicaciones" 
            color="primary" 
            variant="underlined"
            selectedKey={location}
            onSelectionChange={setLocation}
            classNames={{
              tabList: "gap-6 relative rounded-none p-0 border-b border-divider",
              cursor: "w-full bg-primary",
              tab: "max-w-fit px-0 h-12",
              tabContent: "group-data-[selected=true]:text-primary"
            }}
          >
            <Tab key="Laboratorios de Informática" title={
              <div className="flex items-center space-x-2">
                <Monitor size={18} />
                <span>Laboratorios de Informática</span>
              </div>
            }/>
            <Tab key="Oficinas VPDS" title={
              <div className="flex items-center space-x-2">
                <Server size={18} />
                <span>Oficinas VPDS</span>
              </div>
            }/>
          </Tabs>

          <Table aria-label="Tabla de inventario de computadoras" className="mt-4">
            <TableHeader>
              <TableColumn>HOSTNAME</TableColumn>
              <TableColumn>PROCESADOR</TableColumn>
              <TableColumn>RAM</TableColumn>
              <TableColumn>ALMACENAMIENTO</TableColumn>
              <TableColumn>FECHA INST.</TableColumn>
              <TableColumn align="center">ACCIONES</TableColumn>
            </TableHeader>
            <TableBody emptyContent={"No hay equipos registrados en esta ubicación."}>
              {computers.map((comp) => (
                <TableRow key={comp.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-200">{comp.hostname}</span>
                      <span className="text-xs text-slate-500">{comp.mac_address}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Cpu size={16} className="text-slate-400" />
                      <span className="text-sm truncate max-w-[200px]" title={comp.processor}>
                        {comp.processor}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip size="sm" variant="flat" color="secondary">
                      {comp.ram_gb} GB
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <HardDrive size={16} className="text-slate-400" />
                      {comp.storage_gb} GB
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-400">{comp.install_date}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <Button 
                        isIconOnly 
                        color="warning" 
                        variant="flat" 
                        aria-label="Generar QR"
                        onClick={() => handleGenerateQR(comp)}
                      >
                        <QrCode size={18} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                  {selectedComputer?.hostname} - {selectedComputer?.location}
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
