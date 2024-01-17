import express from 'express';

const app = express();

app.listen(3000, console.log('Servidor listo para el trabajo...'));

// middleware
app.use(express.json())

import {
    prepararHATEOAS,
    verJoyas,
    verJoyasPorFiltros
} from './consultas.js'

// función usada como midleware, según lo visto en ayudantía
const reporteDeLaConsulta = async (req, res, next) => {
    const parametros = req.params
    const querys = req.query
    const url = req.url

    console.log(`
        Hoy ${new Date()}, se ha recibido una consulta en la ruta ${url} con parametros y querys: `, parametros, querys )
    next()
}

// Ruta general. La función reporte se transforma en Midleware,
// según lo visto en tutoría
app.get('/joyas', reporteDeLaConsulta, async (req, res) => {
    try{
        const {limits, order_by, page} = req.query;
        console.log('Los respectivos valores de limits, order_by y page son: ',limits, order_by, page)
        const joyas = await verJoyas({limits, order_by, page})
        console.log('Se debe desplegar la siguiente información:', joyas)
        // const HATEOAS = await prepararHATEOAS(joyas)
        res.json(joyas);
    } catch (error) {
        res.status(500).send(error.message)
    }
})

// Profesor, siguiendo su sugerencia, separé esta ruta de la anterior
app.get('/joyasHateoas', async (req, res) => {
    const {limits, order_by, page} = req.query

    console.log('Ahora mostraremos la estructura HATEOAS...')
    console.log(`El valor de limits es ${limits}, el de order_by es ${order_by} y el de page es ${page}`)

    const joyas = await verJoyas({limits, order_by, page})
    const HATEOAS = await prepararHATEOAS(joyas, limits, page)
    res.json(HATEOAS)
})


// Ruta filtrada
app.get('/joyas/filtros', async (req, res) => {
    try{
        const queryStrings = req.query
        const joyas = await verJoyasPorFiltros(queryStrings)
        res.json(joyas)
    } catch (error) {
        res.status(500).send(error.message)
    }
})