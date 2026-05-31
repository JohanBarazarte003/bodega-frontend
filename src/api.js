import axios from 'axios';
const API = 'http://127.0.0.1:5000/api';

// Interceptor para inyectar el Token automáticamente si el usuario inició sesión
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('bodega_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export const api = {
    login: (username, password) => axios.post(`${API}/auth/login`, { username, password }).then(res => res.data),
    getClientes: () => axios.get(`${API}/clientes`).then(res => res.data),
    crearCliente: (c) => axios.post(`${API}/clientes`, c).then(res => res.data),
    getProductos: () => axios.get(`${API}/productos`).then(res => res.data),
    crearProducto: (p) => axios.post(`${API}/productos`, p).then(res => res.data),
    registrarConsumo: (o) => axios.post(`${API}/fiar`, o).then(res => res.data),
    registrarPago: (pago) => axios.post(`${API}/pagos`, pago).then(res => res.data),
    getTasa: () => axios.get(`${API}/tasa`).then(res => res.data),
};