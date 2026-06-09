import { useState } from 'react';
import { Button, Input, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { Plus, Trash2, Edit } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from '../api/axios';

export default function ZonaManager({ zonas, onZonasChange }) {
  const {isOpen, onOpen, onOpenChange} = useDisclosure();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [editingId, setEditingId] = useState(null);

  const handleSave = async (onClose) => {
    try {
      if (editingId) {
        await axios.put(`/zonas/${editingId}/`, { nombre, descripcion });
      } else {
        await axios.post(`/zonas/`, { nombre, descripcion });
      }
      onZonasChange();
      onClose();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error guardando zona', 'error');
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: '¿Seguro que deseas eliminar esta zona?',
      text: "Los equipos quedarán 'Sin Asignar'.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
    if(!result.isConfirmed) return;
    try {
      await axios.delete(`/zonas/${id}/`);
      onZonasChange();
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Error eliminando zona', 'error');
    }
  };

  const openEdit = (zona) => {
    setEditingId(zona.id);
    setNombre(zona.nombre);
    setDescripcion(zona.descripcion || '');
    onOpen();
  };

  const openNew = () => {
    setEditingId(null);
    setNombre('');
    setDescripcion('');
    onOpen();
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-slate-100">Gestión de Zonas</h2>
        <Button color="primary" startContent={<Plus size={18}/>} onPress={openNew}>Nueva Zona</Button>
      </div>

      <Table aria-label="Zonas" classNames={{ wrapper: "bg-slate-800 border border-slate-700" }}>
        <TableHeader>
          <TableColumn>NOMBRE</TableColumn>
          <TableColumn>DESCRIPCIÓN</TableColumn>
          <TableColumn align="end">ACCIONES</TableColumn>
        </TableHeader>
        <TableBody emptyContent="No hay zonas creadas.">
          {zonas.map(zona => (
            <TableRow key={zona.id}>
              <TableCell className="font-medium text-slate-200">{zona.nombre}</TableCell>
              <TableCell className="text-slate-400">{zona.descripcion || '-'}</TableCell>
              <TableCell>
                <div className="flex gap-2 justify-end">
                  <Button isIconOnly size="sm" variant="flat" onPress={() => openEdit(zona)}><Edit size={16}/></Button>
                  <Button isIconOnly size="sm" color="danger" variant="flat" onPress={() => handleDelete(zona.id)}><Trash2 size={16}/></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="blur">
        <ModalContent className="bg-slate-900 border border-slate-700 text-slate-100">
          {(onClose) => (
            <>
              <ModalHeader>{editingId ? 'Editar Zona' : 'Nueva Zona'}</ModalHeader>
              <ModalBody>
                <Input 
                  label="Nombre" 
                  value={nombre} 
                  onChange={e => setNombre(e.target.value)}
                  classNames={{ inputWrapper: "bg-slate-800" }}
                />
                <Input 
                  label="Descripción (opcional)" 
                  value={descripcion} 
                  onChange={e => setDescripcion(e.target.value)}
                  classNames={{ inputWrapper: "bg-slate-800" }}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>Cancelar</Button>
                <Button color="primary" onPress={() => handleSave(onClose)}>Guardar</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
