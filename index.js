const express=require('express');
const routes= require('./routes');
const path=require('path');
//const { body }=require('express-validator');
const flash=require('connect-flash');
const session=require('express-session');
const cookieparser=require('cookie-parser');
const passport=require('./config/passport');
//importar variablesvariables.env
require('dotenv').config({path:'variables.env'});


//helpers con funciones
const helpers=require('./helpers');


//crear conexion BD
const db=require('./config/db');

//importar el modelo
require('./models/Proyectos');
require('./models/Tareas');
require('./models/Usuarios');

db.sync()
    .then(()=> console.log('Conectado al Servidor de BD'))
    .catch(error=> console.log(error));

// crear app de express
const app=express();

//Archivos estaticos
app.use(express.static('public'));

//pug
app.set('view engine','pug');

//habilitar para leer datos del formulario
app.use(express.urlencoded({extended: true}));

//Agregamos express validator a toda la aplicacion
//app.use(expressValidator());


//Carpeta vistas
app.set('views',path.join(__dirname,'./views'));

//Agregar flash messages
app.use(flash());

app.use(cookieparser());

//Sesiones nos permite movernos entre distintas paginas sin volvernos a autenticar
app.use(session({
    secret:'supersecreto',
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());
app.use(passport.session());

//Pasar a vardump a la aplicacion
app.use((req,res,next)=>{
    res.locals.vardump=helpers.vardump
    res.locals.mensajes=req.flash();
    res.locals.usuario={...req.user}||null;//...hace una copia exacta
    next();
});


app.use('/',routes());

const host=process.env.HOST||'0.0.0.0';
const port=process.env.PORT||3000;

app.listen(port,host,()=>{
    console.log('Servidor conectado en puerto '+port);
});