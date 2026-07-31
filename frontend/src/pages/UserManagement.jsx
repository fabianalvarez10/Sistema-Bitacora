import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@nextui-org/react';
import { ArrowLeft, UserPlus, Lock, Unlock, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', email: '', first_name: '', last_name: '', role: 'TECNICO' });
  const [isLoading, setIsLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const openEditModal = (user) => {
    setEditingUser({
      id: user.id,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role || 'TECNICO',
      password: '' 
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      const dataToUpdate = { ...editingUser };
      if (!dataToUpdate.password) {
        delete dataToUpdate.password; // Solo actualiza si hay nueva clave
      }
      await api.patch(`/users/${editingUser.id}/`, dataToUpdate);
      fetchUsers();
      setIsEditModalOpen(false);
      Swal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
    } catch (error) {
      Swal.fire('Error', 'Error al actualizar el usuario. Verifica los datos.', 'error');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password || !formData.email || !formData.role) return;
    setIsLoading(true);
    try {
      await api.post('/users/', formData);
      setFormData({ username: '', password: '', email: '', first_name: '', last_name: '', role: 'TECNICO' });
      fetchUsers();
    } catch (error) {
      Swal.fire('Error', 'Error al crear usuario. Verifica que el username o el correo no estén repetidos.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id, isActive, username) => {
    if (currentUser?.username === username) {
      Swal.fire('Acción bloqueada', 'Por seguridad, no puedes deshabilitar tu propia cuenta mientras tienes la sesión iniciada.', 'warning');
      return;
    }
    const action = isActive ? "deshabilitar" : "habilitar";
    const result = await Swal.fire({
      title: `¿Seguro que deseas ${action} este usuario?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, continuar',
      cancelButtonText: 'Cancelar'
    });
    if(!result.isConfirmed) return;
    try {
      await api.patch(`/users/${id}/`, { is_active: !isActive });
      fetchUsers();
      Swal.fire('Éxito', `Usuario ${isActive ? 'deshabilitado' : 'habilitado'} correctamente`, 'success');
    } catch (error) {
      Swal.fire('Error', `Error al ${action} usuario`, 'error');
    }
  };

  const roleColor = {
    'ADMINISTRADOR': 'success',
    'JEFE_UNIDAD': 'warning',
    'TECNICO': 'primary'
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1E2B4D] to-[#2E5BFF]">
      <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-6 md:gap-8">
        <div className="flex items-center gap-4">
          <Button isIconOnly variant="flat" className="bg-white/10 text-white hover:bg-white/20" onClick={() => navigate('/')}>
            <ArrowLeft size={18} />
          </Button>
          <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-white border border-gray-200 shadow-xl rounded-2xl h-fit">
            <CardBody className="p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><UserPlus size={20} className="text-blue-600" /> Crear Nuevo Usuario</h3>
              <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                <Input label="Usuario (Login)" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} isRequired size="sm" />
                <Input type="email" label="Correo Electrónico" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} isRequired size="sm" />
                <Input type="password" label="Contraseña" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} isRequired size="sm" />
                <div className="flex gap-2">
                  <Input label="Nombre" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} size="sm" isRequired />
                  <Input label="Apellido" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} size="sm" isRequired />
                </div>
                <Select label="Rol del Usuario" selectedKeys={[formData.role]} onChange={e => setFormData({...formData, role: e.target.value})} isRequired size="sm">
                  <SelectItem key="TECNICO" value="TECNICO">Técnico</SelectItem>
                  <SelectItem key="JEFE_UNIDAD" value="JEFE_UNIDAD">Jefe de Unidad</SelectItem>
                  <SelectItem key="ADMINISTRADOR" value="ADMINISTRADOR">Administrador</SelectItem>
                </Select>
                <Button type="submit" color="primary" className="font-bold shadow-md" isLoading={isLoading}>Registrar Usuario</Button>
              </form>
            </CardBody>
          </Card>

          <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-xl rounded-2xl">
            <CardBody className="p-0 overflow-x-auto">
              <Table aria-label="Lista de Usuarios" removeWrapper className="w-full min-w-[600px]">
                <TableHeader>
                  <TableColumn>USUARIO</TableColumn>
                  <TableColumn>CORREO / NOMBRE</TableColumn>
                  <TableColumn>ESTADO</TableColumn>
                  <TableColumn>ROL</TableColumn>
                  <TableColumn>ACCIONES</TableColumn>
                </TableHeader>
                <TableBody emptyContent={"No hay usuarios registrados."}>
                  {users.map(u => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-gray-800">{u.first_name} {u.last_name}</span>
                          <span className="text-xs text-gray-500">{u.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip size="sm" color={u.is_active ? "success" : "default"} variant="dot">
                          {u.is_active ? "Activo" : "Inactivo"}
                        </Chip>
                      </TableCell>
                      <TableCell><Chip size="sm" color={roleColor[u.role] || 'default'} variant="flat" className="font-medium">{u.role}</Chip></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button isIconOnly color="primary" variant="light" size="sm" onClick={() => openEditModal(u)} title="Editar Usuario">
                            <Edit2 size={18} />
                          </Button>
                          <Button isIconOnly color={u.is_active ? "danger" : "success"} variant="light" size="sm" onClick={() => handleToggleStatus(u.id, u.is_active, u.username)} title={u.is_active ? "Deshabilitar Usuario" : "Habilitar Usuario"}>
                            {u.is_active ? <Lock size={18} /> : <Unlock size={18} />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      </div>

      <Modal isOpen={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Editar Usuario</ModalHeader>
              <ModalBody>
                {editingUser && (
                  <div className="flex flex-col gap-4">
                    <Input label="Usuario (Login)" value={editingUser.username} onChange={e => setEditingUser({...editingUser, username: e.target.value})} isRequired size="sm" />
                    <Input type="email" label="Correo Electrónico" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} isRequired size="sm" />
                    <Input type="password" label="Nueva Contraseña (opcional)" placeholder="Dejar en blanco para no cambiar" value={editingUser.password} onChange={e => setEditingUser({...editingUser, password: e.target.value})} size="sm" />
                    <div className="flex gap-2">
                      <Input label="Nombre" value={editingUser.first_name} onChange={e => setEditingUser({...editingUser, first_name: e.target.value})} size="sm" />
                      <Input label="Apellido" value={editingUser.last_name} onChange={e => setEditingUser({...editingUser, last_name: e.target.value})} size="sm" />
                    </div>
                    <Select label="Rol del Usuario" selectedKeys={editingUser.role ? [editingUser.role] : []} onChange={e => setEditingUser({...editingUser, role: e.target.value})} isRequired size="sm">
                      <SelectItem key="TECNICO" value="TECNICO">Técnico</SelectItem>
                      <SelectItem key="JEFE_UNIDAD" value="JEFE_UNIDAD">Jefe de Unidad</SelectItem>
                      <SelectItem key="ADMINISTRADOR" value="ADMINISTRADOR">Administrador</SelectItem>
                    </Select>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button color="primary" onPress={handleUpdateUser}>
                  Guardar Cambios
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
