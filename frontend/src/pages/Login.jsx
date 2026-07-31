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
      if (!err.response) {
        setError('Error de red: El servidor está apagado o tardando en responder. Intenta de nuevo en unos segundos.');
      } else {
        setError('Credenciales incorrectas. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-contain md:bg-cover bg-center bg-no-repeat relative bg-[#0f172a]"
      style={{ backgroundImage: "url('/bg-login.png')" }}
    >
      {/* Overlay oscuro para mejorar la legibilidad sobre la imagen */}
      <div className="absolute inset-0 bg-[#0B1120]/40 z-0"></div>

      <Card className="w-full max-w-md bg-white/95 border border-white/20 shadow-2xl relative z-10">
        <CardBody className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="mb-4 flex justify-center w-full">
              <img src="/logo-ctsi.png" alt="CTSI Logo" className="h-20 w-auto object-contain drop-shadow-sm" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Inicio de Sesión</h1>
            <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              type="text"
              label="Usuario"
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
              className="w-full mt-4 font-bold shadow-md shadow-[#2E5BFF]/30 bg-[#2E5BFF] text-white hover:bg-[#1C41D6]"
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
