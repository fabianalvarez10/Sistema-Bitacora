import React, { useState, useEffect } from 'react';
import { Card, CardBody, Button, Input, Select, SelectItem, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip } from '@nextui-org/react';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function UserManagement() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', email: '', first_name: '', last_name: '', role: 'TECNICO' });
  const [isLoading, setIsLoading] = useState(false);

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
      alert("Error al crear usuario. Verifica que el username o el correo no estén repetidos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if(!window.confirm("¿Seguro que deseas eliminar este usuario?")) return;
    try {
      await api.delete(`/users/${id}/`);
      fetchUsers();
    } catch (error) {
      alert("Error al eliminar usuario");
    }
  };

  const roleColor = {
    'ADMINISTRADOR': 'danger',
    'JEFE_UNIDAD': 'warning',
    'TECNICO': 'primary'
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-6 md:gap-8">
      <div className="flex items-center gap-4">
        <Button isIconOnly variant="flat" onClick={() => navigate('/')}>
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-white border border-gray-200 shadow-sm h-fit">
          <CardBody className="p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><UserPlus size={20} className="text-orange-500" /> Crear Nuevo Usuario</h3>
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

        <Card className="lg:col-span-2 bg-white border border-gray-200 shadow-sm">
          <CardBody className="p-0 overflow-x-auto">
            <Table aria-label="Lista de Usuarios" removeWrapper className="w-full min-w-[500px]">
              <TableHeader>
                <TableColumn>USUARIO</TableColumn>
                <TableColumn>CORREO / NOMBRE</TableColumn>
                <TableColumn>ROL</TableColumn>
                <TableColumn>ACCIONES</TableColumn>
              </TableHeader>
              <TableBody emptyContent={"No hay usuarios registrados."}>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{u.first_name} {u.last_name}</span>
                        <span className="text-xs text-gray-500">{u.email}</span>
                      </div>
                    </TableCell>
                    <TableCell><Chip size="sm" color={roleColor[u.role] || 'default'} variant="flat">{u.role}</Chip></TableCell>
                    <TableCell>
                      <Button isIconOnly color="danger" variant="light" size="sm" onClick={() => handleDeleteUser(u.id)}>
                        <Trash2 size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
