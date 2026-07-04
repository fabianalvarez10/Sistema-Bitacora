import { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';
import {
  Button, Tabs, Tab, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip, Card, CardBody, Accordion, AccordionItem, Select, SelectItem, Input, Switch, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem
} from '@nextui-org/react';
import { QRCodeSVG } from 'qrcode.react';
import { Upload, QrCode, Monitor, Server, Cpu, HardDrive, Settings, MemoryStick, LayoutDashboard, Trash2, Edit2, LogOut, Users, Menu, Search, AlertCircle, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';
import ZonaManager from '../components/ZonaManager';
import '../App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [computers, setComputers] = useState([]);
  const [zonas, setZonas] = useState([]);
  const [locationTab, setLocationTab] = useState('unassigned');
  const [selectedComputer, setSelectedComputer] = useState(null);
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [selectedAuditComputer, setSelectedAuditComputer] = useState(null);
  const {isOpen: isAuditOpen, onOpen: onAuditOpen, onOpenChange: onAuditOpenChange} = useDisclosure();
  const fileInputRef = useRef(null);
  const qrRef = useRef(null);
  
  const [newZoneData, setNewZoneData] = useState({ activeCategory: null, nombre: '' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);

  const handleQuickAddZone = async (e) => {
    e?.preventDefault();
    if (!newZoneData.nombre.trim()) return;
    try {
      await axios.post(`${API_URL}/zonas/`, {
        nombre: newZoneData.nombre,
        categoria: newZoneData.activeCategory
      });
      fetchZonas();
      setNewZoneData({ activeCategory: null, nombre: '' });
    } catch (error) {
      Swal.fire('Error', 'Error al crear la zona. Verifica que el nombre no esté repetido.', 'error');
    }
  };

  const fetchZonas = async () => {
    try {
      const response = await axios.get(`/zonas/`);
      setZonas(response.data);
    } catch (error) {
      console.error("Error fetching zonas:", error);
    }
  };

  const handleEditZone = async (zona, e) => {
    e.stopPropagation();
    const { value: newName } = await Swal.fire({
      title: 'Editar Zona',
      input: 'text',
      inputLabel: 'Nuevo nombre',
      inputValue: zona.nombre,
      showCancelButton: true
    });
    if(newName && newName.trim() !== "" && newName !== zona.nombre) {
      try {
         await axios.put(`/zonas/${zona.id}/`, { nombre: newName, categoria: zona.categoria });
         fetchZonas();
      } catch (err) {
         Swal.fire('Error', 'Error al actualizar la zona', 'error');
      }
    }
  };

  const handleDeleteZone = async (id, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: '¿Seguro que quieres eliminar esta zona?',
      text: "Los equipos que estén adentro pasarán a estar 'No Asignados'.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    });
    if(result.isConfirmed) {
      try {
         await axios.delete(`/zonas/${id}/`);
         fetchZonas();
         if (locationTab === id.toString()) setLocationTab('unassigned');
         fetchComputers(locationTab);
      } catch (err) {
         Swal.fire('Error', 'Error al eliminar la zona', 'error');
      }
    }
  };

  const fetchComputers = async (tab) => {
    try {
      let url = `/computers/`;
      if (tab === 'unassigned') {
        url += `?unassigned=true`;
      } else if (tab !== 'manage' && tab !== 'all') {
        url += `?zona=${tab}`;
      }
      const response = await axios.get(url);
      setComputers(response.data);
    } catch (error) {
      console.error("Error fetching computers:", error);
    }
  };

  const handleDeleteComputer = async (id, e) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "Esta acción eliminará este equipo del sistema de forma permanente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar'
    });
    if(result.isConfirmed) {
      try {
        await axios.delete(`/computers/${id}/`);
        fetchComputers(locationTab);
        Swal.fire('Eliminado', 'El equipo ha sido eliminado.', 'success');
      } catch (error) {
        Swal.fire('Error', 'Error al eliminar el equipo', 'error');
      }
    }
  };

  useEffect(() => {
    fetchZonas();
  }, []);

  useEffect(() => {
    if (locationTab !== 'manage') {
      fetchComputers(locationTab);
    }
  }, [locationTab, zonas]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`/upload-inventory/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if(response.status === 200) {
        Swal.fire('¡Éxito!', 'Inventario subido exitosamente! Lo encontrarás en "Sin Asignar".', 'success');
        fetchComputers(locationTab);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      Swal.fire('Error', 'Error al subir el archivo.', 'error');
    }
    e.target.value = null;
  };

  const handleDownloadCollector = () => {
    window.open('https://drive.google.com/uc?export=download&id=1Yi8xb9H2RZY1_-pBSg_Iv15FCSePycTe', '_blank');
  };

  const handleAssignZone = async (computerId, newZonaId) => {
    try {
      await axios.patch(`/computers/${computerId}/zona/`, { zona_id: newZonaId === 'none' ? null : newZonaId });
      fetchComputers(locationTab);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Equipo reasignado',
        showConfirmButton: false,
        timer: 3000
      });
    } catch (error) {
      console.error("Error assigning zone:", error);
      Swal.fire('Error', 'Error al asignar zona.', 'error');
    }
  };

  const handleGenerateQR = (computer, e) => {
    if(e) e.stopPropagation();
    setSelectedComputer(computer);
    onOpen();
  };

  const handleOpenAudit = (computer, e) => {
    if(e) e.stopPropagation();
    setSelectedAuditComputer(computer);
    onAuditOpen();
  };

  const handleDownloadQR = () => {
    const svgElement = qrRef.current;
    if (!svgElement) return;
    
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], {type: "image/svg+xml;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_${selectedComputer.alias || selectedComputer.hostname}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getQRDataString = (comp) => {
    if (!comp) return '';
    
    const office = comp.programas?.find(p => 
      p.nombre.toLowerCase().includes('office') || 
      p.nombre.toLowerCase().includes('word') || 
      p.nombre.toLowerCase().includes('excel')
    );
    
    const gpus = comp.hardware_extra?.filter(h => h.tipo === 'GPU').map(h => h.modelo).join(', ') || 'Ninguna';
    const wifis = comp.hardware_extra?.filter(h => h.tipo.includes('Wi-Fi')).map(h => h.modelo).join(', ') || 'Ninguna';
    const discosTipos = comp.discos_detalle?.map(d => d.tipo).join(', ') || comp.tipo_disco;

    return `Equipo: ${comp.alias || comp.hostname}
ID: ${comp.hostname}
MAC: ${comp.mac_address}
Zona: ${comp.zona_nombre || 'No Asignada'}

--- SISTEMA ---
OS: ${comp.os_version || 'Windows'}
Instalado: ${comp.install_date}
Office: ${office ? `${office.nombre} (Instalado: ${office.fecha_instalacion || 'Desconocida'})` : 'No Instalado'}

--- HARDWARE ---
CPU: ${comp.processor}
RAM: ${comp.ram_gb} GB (${comp.tipo_ram})
Almacenamiento: ${comp.storage_gb} GB (${discosTipos})
Video: ${gpus}
Wi-Fi: ${wifis}`;
  };

  const filteredComputers = computers.filter(comp => {
    // Filtro por alertas
    if (showAlertsOnly) {
      const hasAlerts = (comp.alertas_remocion?.programas?.length > 0) || 
                        (comp.alertas_remocion?.hardware?.length > 0) || 
                        (comp.alertas_remocion?.discos?.length > 0);
      if (!hasAlerts) return false;
    }
    
    // Filtro por texto
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const alias = (comp.alias || '').toLowerCase();
      const hostname = (comp.hostname || '').toLowerCase();
      const mac = (comp.mac_address || '').toLowerCase();
      const processor = (comp.processor || '').toLowerCase();
      
      if (!alias.includes(query) && !hostname.includes(query) && !mac.includes(query) && !processor.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Reporte de Inventario - CTSI', 14, 22);
    doc.setFontSize(10);
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);
    
    let zoneText = locationTab === 'all' ? 'Todos los Equipos' : 
                   locationTab === 'unassigned' ? 'No Asignados' : 
                   zonas.find(z => z.id.toString() === locationTab.toString())?.nombre || 'General';
    doc.text(`Zona de Reporte: ${zoneText}`, 14, 36);

    const tableColumn = ["Alias", "ID (Host)", "MAC Address", "Zona", "CPU", "RAM", "Estado"];
    const tableRows = [];

    filteredComputers.forEach(comp => {
      const hasAlerts = (comp.alertas_remocion?.programas?.length > 0) || 
                        (comp.alertas_remocion?.hardware?.length > 0) || 
                        (comp.alertas_remocion?.discos?.length > 0);
      const estado = hasAlerts ? 'Alerta' : 'Normal';
      
      const rowData = [
        comp.alias || 'N/A',
        comp.hostname,
        comp.mac_address,
        comp.zona_nombre || 'N/A',
        comp.processor,
        `${comp.ram_gb} GB`,
        estado
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [249, 115, 22] }
    });

    doc.save(`Inventario_${zoneText.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
  };

  const exportToExcel = () => {
    const tableData = filteredComputers.map(comp => {
      const hasAlerts = (comp.alertas_remocion?.programas?.length > 0) || 
                        (comp.alertas_remocion?.hardware?.length > 0) || 
                        (comp.alertas_remocion?.discos?.length > 0);
      return {
        "Alias": comp.alias || 'N/A',
        "ID (Hostname)": comp.hostname,
        "MAC Address": comp.mac_address,
        "IP": comp.ip_address || "No disponible",
        "Procesador": comp.processor,
        "Placa Madre": comp.motherboard || "Desconocida",
        "BIOS": comp.bios_version || "Desconocida",
        "RAM (GB)": comp.ram_gb,
        "Almacenamiento (GB)": comp.storage_gb,
        "SO": comp.os_version,
        "Estado": hasAlerts ? 'Con Alerta' : 'Normal'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(tableData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario");
    
    let zoneText = locationTab === 'all' ? 'Todos' : 
                   locationTab === 'unassigned' ? 'No_Asignados' : 
                   zonas.find(z => z.id.toString() === locationTab.toString())?.nombre || 'General';
                   
    XLSX.writeFile(workbook, `Inventario_${zoneText.replace(/ /g, '_')}_${new Date().getTime()}.xlsx`);
  };

  return (
    <div className="w-full flex flex-col min-h-screen bg-[#F0F4F8] font-sans">
      {/* Dark Navy Full-Width Header */}
      <div className="bg-[#2A4072] w-full pt-8 pb-24 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <img src="/logo-ctsi.png" alt="CTSI Logo" className="h-20 w-auto object-contain" />
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Inventario Hardware CTSI
              </h1>
              <p className="text-gray-300 mt-1 font-light text-sm md:text-base">Sistema de gestión de recursos tecnológicos de la universidad</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-2 lg:mt-0 w-full lg:w-auto">
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
            />
            {user?.role === 'ADMINISTRADOR' && (
              <Button 
                variant="flat" 
                className="bg-white/10 text-white hover:bg-white/20 font-medium border border-white/10"
                startContent={<Users size={18} />}
                onClick={() => navigate('/users')}
              >
                Usuarios
              </Button>
            )}
            {(user?.role === 'ADMINISTRADOR' || user?.role === 'TECNICO') && (
              <>
                <Button 
                  variant="flat" 
                  className="bg-white/10 text-white hover:bg-white/20 font-medium border border-white/10"
                  startContent={<Download size={18} />}
                  onClick={handleDownloadCollector}
                >
                  Descargar Recolector
                </Button>
                <Button 
                  className="bg-[#2E5BFF] text-white hover:bg-[#1C41D6] font-medium shadow-lg shadow-[#2E5BFF]/30 flex-1 lg:flex-none border border-[#2E5BFF]/50"
                  startContent={<Upload size={18} />}
                  onClick={() => fileInputRef.current.click()}
                >
                  Importar Equipo
                </Button>
              </>
            )}
            <Button 
              isIconOnly 
              variant="light" 
              className="text-white hover:bg-white/10 ml-auto lg:ml-0" 
              onClick={logout}
              aria-label="Cerrar sesión"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 md:px-8 flex flex-col gap-6 md:gap-8 -mt-14 relative z-10 pb-10">
        {/* KPI Cards (Glassmorphism) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Card className="bg-white/40 backdrop-blur-md border border-white/60 shadow-xl rounded-2xl">
            <CardBody className="flex flex-row items-center gap-4 p-5">
              <div className="p-3 bg-white/60 rounded-xl text-blue-700 shadow-sm"><Monitor size={24}/></div>
              <div>
                <p className="text-sm text-slate-700 font-semibold">Equipos Listados</p>
                <p className="text-3xl font-bold text-slate-900 drop-shadow-sm">{computers.length}</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white/40 backdrop-blur-md border border-white/60 shadow-xl rounded-2xl">
            <CardBody className="flex flex-row items-center gap-4 p-5">
              <div className="p-3 bg-white/60 rounded-xl text-blue-700 shadow-sm"><LayoutDashboard size={24}/></div>
              <div>
                <p className="text-sm text-slate-700 font-semibold">Zonas Activas</p>
                <p className="text-3xl font-bold text-slate-900 drop-shadow-sm">{zonas.length}</p>
              </div>
            </CardBody>
          </Card>
          <Card className="bg-white/40 backdrop-blur-md border border-white/60 shadow-xl rounded-2xl">
            <CardBody className="flex flex-row items-center gap-4 p-5">
              <div className="p-3 bg-white/60 rounded-xl text-blue-700 shadow-sm"><Server size={24}/></div>
              <div>
                <p className="text-sm text-slate-700 font-semibold">Vista Actual</p>
                <p className="text-xl font-bold text-slate-900 drop-shadow-sm truncate max-w-[150px] sm:max-w-[200px]">
                  {locationTab === 'all' ? 'Todos los Equipos' : locationTab === 'unassigned' ? 'Equipos No Asignados' : (locationTab === 'manage' ? 'Gestión' : zonas.find(z => z.id.toString() === locationTab.toString())?.nombre || 'General')}
                </p>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Main Content Area */}
        <Card className="bg-white border border-gray-200 shadow-lg min-h-[500px] rounded-2xl overflow-hidden">
          <CardBody className="p-0 flex flex-col md:flex-row">
          
          {/* Mobile Sidebar Toggle */}
          <div className="md:hidden p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <span className="font-semibold text-gray-700 uppercase tracking-wider text-sm flex items-center gap-2"><LayoutDashboard size={16}/> Navegación</span>
            <Button isIconOnly variant="flat" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Menu size={18} />
            </Button>
          </div>

          {/* Vertical Sidebar / Categories */}
          <div className={`md:w-64 border-b md:border-b-0 md:border-r border-gray-200 bg-[#F8FAFC] p-4 flex-col shrink-0 overflow-y-auto ${isSidebarOpen ? 'flex' : 'hidden md:flex'}`}>
            <h3 className="hidden md:block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Navegación</h3>
            
            <Button 
              variant={locationTab === 'all' ? "flat" : "light"} 
              className={`justify-start w-full mb-1 font-medium ${locationTab === 'all' ? 'bg-blue-50 text-[#2E5BFF]' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setLocationTab('all')}
            >
              <Server size={18} /> Todos los Equipos
            </Button>
            
            <Button 
              variant={locationTab === 'unassigned' ? "flat" : "light"} 
              className={`justify-start w-full mb-2 font-medium ${locationTab === 'unassigned' ? 'bg-blue-50 text-[#2E5BFF]' : 'text-slate-600 hover:bg-slate-100'}`}
              onClick={() => setLocationTab('unassigned')}
            >
              <LayoutDashboard size={18} /> Equipos No Asignados
            </Button>

            <Accordion variant="light" selectionMode="multiple" defaultExpandedKeys={["LABORATORIO", "VPDS"]}>
              
              {/* LABORATORIOS */}
              <AccordionItem key="LABORATORIO" title={<span className="font-semibold text-gray-700 text-sm">Laboratorios</span>}>
                <div className="flex flex-col gap-1">
                  {zonas.filter(z => z.categoria === 'LABORATORIO').map(zona => (
                    <div key={zona.id} className="relative group w-full flex items-center">
                      <Button 
                        variant={locationTab === zona.id.toString() ? "flat" : "light"} 
                        className={`justify-start flex-1 text-sm pr-12 font-medium ${locationTab === zona.id.toString() ? 'bg-blue-50 text-[#2E5BFF]' : 'text-slate-600 hover:bg-slate-100'}`}
                        size="sm"
                        onClick={() => setLocationTab(zona.id.toString())}
                      >
                        <Monitor size={16} /> {zona.nombre}
                      </Button>
                      {user?.role === 'ADMINISTRADOR' && (
                        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                          <button onClick={(e) => handleEditZone(zona, e)} className="p-1 text-gray-400 hover:text-blue-500 rounded"><Edit2 size={12}/></button>
                          <button onClick={(e) => handleDeleteZone(zona.id, e)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={12}/></button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {newZoneData.activeCategory === 'LABORATORIO' ? (
                    <form onSubmit={handleQuickAddZone} className="flex gap-2 mt-2 px-1">
                      <Input 
                        size="sm" 
                        placeholder="Nombre ej. Lab A" 
                        autoFocus
                        value={newZoneData.nombre}
                        onChange={(e) => setNewZoneData({...newZoneData, nombre: e.target.value})}
                      />
                      <Button type="submit" size="sm" color="success" isIconOnly>✓</Button>
                    </form>
                  ) : (
                    user?.role === 'ADMINISTRADOR' && (
                      <Button size="sm" variant="light" color="success" className="justify-start w-full" onClick={() => setNewZoneData({ activeCategory: 'LABORATORIO', nombre: '' })}>
                        + Agregar más laboratorios
                      </Button>
                    )
                  )}
                </div>
              </AccordionItem>

              {/* VPDS */}
              <AccordionItem key="VPDS" title={<span className="font-semibold text-gray-700 text-sm">VPDS (Oficinas)</span>}>
                <div className="flex flex-col gap-1">
                  {zonas.filter(z => z.categoria === 'VPDS').map(zona => (
                    <div key={zona.id} className="relative group w-full flex items-center">
                      <Button 
                        variant={locationTab === zona.id.toString() ? "flat" : "light"} 
                        className={`justify-start flex-1 text-sm pr-12 font-medium ${locationTab === zona.id.toString() ? 'bg-blue-50 text-[#2E5BFF]' : 'text-slate-600 hover:bg-slate-100'}`}
                        size="sm"
                        onClick={() => setLocationTab(zona.id.toString())}
                      >
                        <Monitor size={16} /> {zona.nombre}
                      </Button>
                      {user?.role === 'ADMINISTRADOR' && (
                        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                          <button onClick={(e) => handleEditZone(zona, e)} className="p-1 text-gray-400 hover:text-blue-500 rounded"><Edit2 size={12}/></button>
                          <button onClick={(e) => handleDeleteZone(zona.id, e)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 size={12}/></button>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {newZoneData.activeCategory === 'VPDS' ? (
                    <form onSubmit={handleQuickAddZone} className="flex gap-2 mt-2 px-1">
                      <Input 
                        size="sm" 
                        placeholder="Nombre ej. Caja" 
                        autoFocus
                        value={newZoneData.nombre}
                        onChange={(e) => setNewZoneData({...newZoneData, nombre: e.target.value})}
                      />
                      <Button type="submit" size="sm" color="success" isIconOnly>✓</Button>
                    </form>
                  ) : (
                    user?.role === 'ADMINISTRADOR' && (
                      <Button size="sm" variant="light" color="success" className="justify-start w-full" onClick={() => setNewZoneData({ activeCategory: 'VPDS', nombre: '' })}>
                        + Agregar más oficinas
                      </Button>
                    )
                  )}
                </div>
              </AccordionItem>

              {/* OTROS */}
              {zonas.filter(z => z.categoria === 'OTRO').length > 0 && (
                <AccordionItem key="OTRO" title={<span className="font-semibold text-gray-700 text-sm">Otras Áreas</span>}>
                  <div className="flex flex-col gap-1">
                    {zonas.filter(z => z.categoria === 'OTRO').map(zona => (
                      <Button 
                        key={zona.id} 
                        variant={locationTab === zona.id.toString() ? "flat" : "light"} 
                        className={`justify-start w-full text-sm font-medium ${locationTab === zona.id.toString() ? 'bg-blue-50 text-[#2E5BFF]' : 'text-slate-600 hover:bg-slate-100'}`}
                        size="sm"
                        onClick={() => setLocationTab(zona.id.toString())}
                      >
                        <Monitor size={16} /> {zona.nombre}
                      </Button>
                    ))}
                  </div>
                </AccordionItem>
              )}

            </Accordion>

            <div className="mt-auto pt-4 border-t border-gray-200">
              <Button 
                variant={locationTab === 'manage' ? "flat" : "light"} 
                color="warning" 
                className="justify-start w-full font-medium"
                onClick={() => setLocationTab('manage')}
              >
                <Settings size={18} /> Gestionar Zonas
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-hidden">
            {locationTab === 'manage' ? (
              <ZonaManager zonas={zonas} onZonasChange={fetchZonas} />
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-3 mb-6">
                  <Input
                    placeholder="Buscar por MAC, ID, Nombre o CPU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    startContent={<Search size={18} className="text-gray-400" />}
                    className="flex-1"
                    variant="bordered"
                    size="sm"
                  />
                  <Button 
                    color={showAlertsOnly ? "danger" : "default"} 
                    variant={showAlertsOnly ? "flat" : "bordered"}
                    onClick={() => setShowAlertsOnly(!showAlertsOnly)}
                    startContent={<AlertCircle size={18} />}
                    className="md:w-auto w-full font-medium border-gray-200"
                    size="sm"
                  >
                    Solo Alertas
                  </Button>
                  
                  <Dropdown>
                    <DropdownTrigger>
                      <Button 
                        variant="flat" 
                        color="secondary"
                        startContent={<Download size={18} />}
                        className="md:w-auto w-full font-medium"
                        size="sm"
                      >
                        Exportar
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu 
                      aria-label="Opciones de exportación"
                      onAction={(key) => {
                        if (key === "pdf") exportToPDF();
                        if (key === "excel") exportToExcel();
                      }}
                    >
                      <DropdownItem 
                        key="pdf" 
                        startContent={<FileText size={18} className="text-danger" />}
                      >
                        Descargar como PDF
                      </DropdownItem>
                      <DropdownItem 
                        key="excel" 
                        startContent={<FileSpreadsheet size={18} className="text-success" />}
                      >
                        Descargar como Excel
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                
                {filteredComputers.length === 0 ? (
                  <div className="text-center text-gray-500 py-12 md:py-16 flex flex-col items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200 mx-2 md:mx-0">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                      <Search size={48} className="text-blue-300" />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold text-gray-700">No se encontraron equipos</h3>
                    <p className="text-xs md:text-sm text-gray-400 mt-1 max-w-sm px-4">
                      {searchQuery || showAlertsOnly ? "Intenta borrar los filtros de búsqueda o cambiar de zona." : "Importa el archivo JSON de un equipo o muévelo desde otra zona para comenzar."}
                    </p>
                  </div>
                ) : (
                  <Accordion variant="splitted">
                    {filteredComputers.map(comp => (
                      <AccordionItem 
                        key={comp.id} 
                        aria-label={comp.hostname}
                        classNames={{
                          base: "bg-white border border-gray-200 shadow-sm",
                          title: "text-gray-800",
                          content: "text-gray-600 px-4 pb-4"
                        }}
                        title={
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full pr-4 gap-3 sm:gap-0">
                            <div className="flex flex-col w-full sm:w-auto">
                              <div className="flex items-center gap-2">
                                {((comp.alertas_remocion?.programas?.length > 0) || (comp.alertas_remocion?.hardware?.length > 0) || (comp.alertas_remocion?.discos?.length > 0)) ? (
                                  <span className="relative flex h-2.5 w-2.5" title="Alerta: Componentes removidos">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-red-400"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                  </span>
                                ) : (
                                  <span className="relative flex h-2.5 w-2.5" title="Todo en orden">
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#4ADE80]"></span>
                                  </span>
                                )}
                                <span className="font-bold text-lg">{comp.alias || comp.hostname}</span>
                              </div>
                              {comp.alias ? (
                                <span className="text-xs text-gray-500 font-mono">ID: {comp.hostname} | MAC: {comp.mac_address}</span>
                              ) : (
                                <span className="text-xs text-gray-500 font-mono">{comp.mac_address}</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                              <div className="px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-medium mr-auto sm:mr-0">
                                {comp.zona_nombre || "Equipo No Asignado"}
                              </div>
                              <Button 
                                size="sm" 
                                className="bg-slate-100 text-slate-700 font-medium hover:bg-slate-200"
                                onClick={(e) => handleOpenAudit(comp, e)}
                              >
                                Revisión
                              </Button>
                              <Button 
                                isIconOnly 
                                className="bg-[#E0E7FF] text-[#4F46E5] hover:bg-[#C7D2FE]" 
                                size="sm"
                                aria-label="Generar QR"
                                onClick={(e) => handleGenerateQR(comp, e)}
                              >
                                <QrCode size={16} />
                              </Button>
                              <Button 
                                isIconOnly 
                                className="bg-[#F87171] text-white hover:bg-red-500 shadow-sm" 
                                size="sm"
                                aria-label="Eliminar"
                                onClick={(e) => handleDeleteComputer(comp.id, e)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </div>
                          </div>
                        }
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 pt-4 border-t border-gray-200">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2"><div className="p-1 bg-blue-100 text-blue-600 rounded"><Cpu size={14}/></div> Procesador</span>
                            <span className="text-sm font-medium">{comp.processor}</span>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2"><div className="p-1 bg-blue-100 text-blue-600 rounded"><MemoryStick size={14}/></div> Memoria RAM</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{comp.ram_gb} GB</span>
                              <Chip size="sm" color="default" variant="bordered" className="text-xs border-gray-300">{comp.tipo_ram}</Chip>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2"><div className="p-1 bg-blue-100 text-blue-600 rounded"><HardDrive size={14}/></div> Almacenamiento</span>
                            {comp.discos_detalle && comp.discos_detalle.length > 0 ? (
                              <div className="flex flex-col gap-2 mt-1">
                                <span className="text-xs text-gray-400">{comp.discos_detalle.length} {comp.discos_detalle.length === 1 ? 'Disco Instalado' : 'Discos Instalados'} (Total: {comp.storage_gb} GB)</span>
                                <div className="flex flex-col gap-1">
                                  {comp.discos_detalle.map((disco, idx) => (
                                    <div key={idx} className="flex flex-col p-2 bg-gray-50 rounded-md border border-gray-100">
                                      <span className="text-xs font-semibold text-gray-700">{disco.modelo}</span>
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-medium text-gray-500">{disco.capacidad_gb} GB</span>
                                        <Chip size="sm" color="default" variant="bordered" className="text-[10px] h-5 border-gray-300">{disco.tipo}</Chip>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-medium">{comp.storage_gb} GB</span>
                                <Chip size="sm" color="default" variant="bordered" className="text-xs border-gray-300">{comp.tipo_disco}</Chip>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2"><div className="p-1 bg-blue-100 text-blue-600 rounded"><Server size={14}/></div> Placa Madre / BIOS</span>
                            <div className="flex flex-col gap-1 mt-1">
                              <span className="text-sm font-medium">{comp.motherboard || 'Desconocida'}</span>
                              <span className="text-xs text-gray-400">BIOS: {comp.bios_version || 'Desconocida'}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-500 font-semibold uppercase flex items-center gap-2"><div className="p-1 bg-blue-100 text-blue-600 rounded"><Settings size={14}/></div> Asignar a Zona</span>
                            <Select 
                              size="sm"
                              placeholder="Seleccionar zona" 
                              selectedKeys={[comp.zona ? comp.zona.toString() : 'none']}
                              onChange={(e) => handleAssignZone(comp.id, e.target.value)}
                              classNames={{ trigger: "bg-white border border-gray-200" }}
                            >
                              <SelectItem key="none" value="none">Equipos No Asignados</SelectItem>
                              {zonas.map(z => (
                                <SelectItem key={z.id.toString()} value={z.id.toString()}>{z.nombre}</SelectItem>
                              ))}
                            </Select>
                          </div>
                          
                          <div className="col-span-full mt-2">
                             <span className="text-xs text-gray-500">Instalación OS: {comp.install_date}</span>
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
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent className="bg-white border border-gray-200">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-gray-800">
                Código QR del Equipo
                <span className="text-sm font-normal text-gray-500">
                  {selectedComputer?.hostname} - {selectedComputer?.zona_nombre || 'Sin Asignar'}
                </span>
              </ModalHeader>
              <ModalBody className="flex flex-col items-center py-6">
                <div className="bg-white p-2 rounded-xl shadow-xl flex flex-col items-center">
                  <svg ref={qrRef} width={250} height={280} viewBox="0 0 250 280" xmlns="http://www.w3.org/2000/svg">
                    <rect width="100%" height="100%" fill="white" rx="12" />
                    <g transform="translate(25, 10)">
                       <QRCodeSVG 
                         value={getQRDataString(selectedComputer)} 
                         size={200}
                         level="M"
                         includeMargin={true}
                       />
                    </g>
                    <text x="125" y="240" fontFamily="sans-serif" fontSize="16" fontWeight="bold" textAnchor="middle" fill="black">
                      {selectedComputer?.alias || selectedComputer?.hostname}
                    </text>
                    <text x="125" y="260" fontFamily="monospace" fontSize="12" textAnchor="middle" fill="#666">
                      MAC: {selectedComputer?.mac_address}
                    </text>
                  </svg>
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center px-4">
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

      {/* Audit Modal */}
      <Modal isOpen={isAuditOpen} onOpenChange={onAuditOpenChange} size="3xl" scrollBehavior="inside" backdrop="blur">
        <ModalContent className="bg-white border border-gray-200">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-gray-800">
                Revisión del Equipo
                <span className="text-sm font-normal text-gray-500">
                  {selectedAuditComputer?.hostname}
                </span>
              </ModalHeader>
              <ModalBody className="py-4">
                <Tabs aria-label="Auditoría" color="primary">
                  <Tab key="software" title="Software Instalado">
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 overflow-x-auto max-h-96">
                      <table className="w-full text-left text-sm text-gray-700">
                        <thead className="text-xs uppercase bg-gray-100 text-gray-500 sticky top-0">
                          <tr>
                            <th className="px-4 py-2">Nombre</th>
                            <th className="px-4 py-2">Versión</th>
                            <th className="px-4 py-2">Instalación</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedAuditComputer?.programas?.map((p, i) => (
                            <tr key={i} className="border-b border-gray-200 hover:bg-gray-100">
                              <td className="px-4 py-2">{p.nombre}</td>
                              <td className="px-4 py-2">{p.version}</td>
                              <td className="px-4 py-2">{p.fecha_instalacion}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Tab>
                  <Tab key="hardware" title="Hardware Extra">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedAuditComputer?.hardware_extra?.map((hw, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-md border border-gray-200 flex flex-col">
                          <span className="text-xs text-primary font-semibold uppercase">{hw.tipo}</span>
                          <span className="text-sm text-gray-800 mt-1">{hw.modelo}</span>
                        </div>
                      ))}
                    </div>
                  </Tab>
                  <Tab key="alertas" title={
                    <div className="flex items-center gap-2">
                      <span>Alertas (Removidos)</span>
                      {(selectedAuditComputer?.alertas_remocion?.programas?.length > 0 || selectedAuditComputer?.alertas_remocion?.hardware?.length > 0 || selectedAuditComputer?.alertas_remocion?.discos?.length > 0) && (
                        <div className="w-2 h-2 rounded-full bg-danger"></div>
                      )}
                    </div>
                  }>
                    <div className="flex flex-col gap-4">
                      {['discos', 'hardware', 'programas'].map(tipo => {
                        const alertas = selectedAuditComputer?.alertas_remocion?.[tipo] || [];
                        if (alertas.length === 0) return null;
                        return (
                          <div key={tipo} className="p-4 bg-danger/10 border border-danger/30 rounded-lg">
                            <h4 className="text-danger font-semibold uppercase text-sm mb-2">{tipo} Removidos</h4>
                            <ul className="list-disc list-inside text-sm text-slate-300">
                              {alertas.map((a, i) => (
                                <li key={i}><span className="font-medium text-slate-200">{a.elemento}</span> <span className="text-xs text-slate-500">(Detectado el: {a.fecha_detectado})</span></li>
                              ))}
                            </ul>
                          </div>
                        )
                      })}
                      {(!selectedAuditComputer?.alertas_remocion?.programas?.length && !selectedAuditComputer?.alertas_remocion?.hardware?.length && !selectedAuditComputer?.alertas_remocion?.discos?.length) && (
                        <div className="p-4 text-center text-slate-400 bg-slate-800 rounded-lg border border-slate-700">
                          No se han detectado componentes o programas removidos en este equipo.
                        </div>
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="flat" onPress={onClose}>
                  Cerrar
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

    </div>
  );
}

