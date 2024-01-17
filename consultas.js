import pkg from 'pg';
const { Pool } = pkg;

import format from 'pg-format';

const pool = new Pool({
    user: "jorge",
    host: "localhost",
    password: "1234",
    database: "joyas",
    allowExitOnIdle: true
})

// Se llaman variables con los siguientes valores por defecto:
// defaultLimits = 3
// defaultOrder = 'precio_ASC' cuyo formato general es campo_SENTIDO
// defaultPage = 1
// Los archivos de valores están los archivos de la carpeta CONFIG 
import { defaultLimits, defaultOrder, defaultPage } from './config/index.js';

// Ver contenido
const verJoyas = async ({ limits = defaultLimits, order_by = defaultOrder, page = defaultPage }) => {
    const [campo, sentido] = order_by.split('_');
    const offset = (page - 1) * limits

    console.log(`El campo ${campo} es ordenado en forma ${sentido}`)
    console.log(`El valor de page es ${page}, el de offset es ${offset}`)

    if (page <= 0) {
        console.log('El valor de page debe ser un entero positivo...')
    } else if (limits <= 0) {
        console.log('Cuidado, le está asignando a limits un valor no permitido...')
    }

    const formattedQuery = format('SELECT * FROM inventario order by %s %s LIMIT %s OFFSET %s', campo, sentido, limits, offset);

    const { rows: inventario } = await pool.query(formattedQuery)

    return inventario
}

// Filtros
const verJoyasPorFiltros = async ({precio_min, precio_max, categoria, metal}) => {
    console.log('Se están aplicando los filtros...')
    let filtros = []
    const values = []

    const agregarFiltro = (campo, comparador, valor) => {
        values.push(valor)
        const { length } = filtros
        filtros.push(`${campo} ${comparador} $${length + 1}`)
    }

    console.log('Filtros aplicados...')

    // Se verifica que todos los datos del filtro tengan valores permitidos
    if(parseInt(precio_min) <= 0 || parseInt(precio_max) <= 0) {
        console.log('Los precios no pueden tener valores negativos. Por favor corrija ese detalle...')
        throw new Error('No pueden haber valores negativos en los precios...')
    }

    // Se verifica que el precio máximo, sea mayor que el precio mínimo.
    if(parseInt(precio_min) >= parseInt(precio_max)) {
        console.log('Los valores de los precios deben están en orden inverso. Corrija ese detalle...')
        throw new Error('El mínimo es mayor o igual al máximo...')
    } else {
        if (precio_min) agregarFiltro('precio', '>=', precio_min)
        if (precio_max) agregarFiltro('precio', '<=', precio_max)
    }

    if(categoria) agregarFiltro('categoria', '=', `${categoria}`)
    if(metal) agregarFiltro('metal', '=', `${metal}`)
    
    let consulta = 'SELECT * FROM inventario'

    if (filtros.length > 0) {
        filtros = filtros.join(' AND ')
        consulta += ` WHERE ${filtros}`
    }

    const { rows: inventario } = await pool.query(consulta, values)
    return inventario
}

// Función prepararHATEOAS construída según lo visto en tutoría
const prepararHATEOAS = async (inventario, limits, page) => {

    const results = inventario.map( i => {
        return {
            nombre: i.nombre,
            precio: i.precio,
            metal: i.metal,
            url: `http://localhost:3000/joyas/${i.id}`
            // href: `/joyas/joya/${i.id}`
        }
    })//.slice(0, 4)

    // Sugerencia vista en tutoría
    console.log(results)

    const text = 'SELECT * FROM inventario'
    const { rows: data } = await pool.query(text)

    // const total = inventario.length
    const total = data.length
    const total_pages = Math.ceil(total / limits)

    console.log('Total registros, Limits, Total páginas: ', total, limits, total_pages)

    const HATEOAS = {
        total,
        results,
        // Lo que viene es la sugerencia vista en tutoría
        meta: {
            total: total,
            limit: parseInt(limits),
            page: parseInt(page),
            total_pages: total_pages,
            next: 
                total_pages <= page
                ? null
                : `http://localhost:3000/joyas?limits=${limits}&page=${parseInt(page) + 1}`,
            previous: 
                page <= 1
                ? null
                : `http://localhost:3000/joyas?limits=${limits}&page=${parseInt(page) - 1}`,
        },
    }

    console.log(HATEOAS)

    return HATEOAS
}

// Exportaciones
export {
    verJoyas,
    verJoyasPorFiltros,
    prepararHATEOAS
}