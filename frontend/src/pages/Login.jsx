import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody, Input, Button } from '@nextui-org/react';
import { Server, Lock, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError('Credenciales incorrectas. Inténtalo de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md bg-white border border-gray-200 shadow-xl">
        <CardBody className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="p-4 bg-orange-100 rounded-full mb-4">
              <Server size={40} className="text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">CTSI Inventario</h1>
            <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              type="text"
              label="Usuario"
              placeholder="Ej. admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              startContent={<UserIcon size={18} className="text-gray-400" />}
              variant="bordered"
              isRequired
            />
            <Input
              type="password"
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              startContent={<Lock size={18} className="text-gray-400" />}
              variant="bordered"
              isRequired
            />

            {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

            <Button 
              type="submit" 
              color="primary" 
              className="w-full mt-4 font-bold shadow-md shadow-orange-500/20"
              isLoading={isLoading}
            >
              Iniciar Sesión
            </Button>

            <div className="text-center mt-2">
              <Link to="/forgot-password" className="text-sm text-blue-600 hover:text-orange-500 hover:underline transition-colors">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
