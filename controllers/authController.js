const passport=require('passport');
const Usuarios = require('../models/Usuarios');
const Sequelize=require('sequelize');
const Op=Sequelize.Op;
const crypto=require('crypto');
const bcrypt=require('bcrypt-nodejs');
const enviarEmail=require('../handlers/email');

exports.autenticarUsuario=passport.authenticate('local',{
    successRedirect:'/',
    failureRedirect:'/iniciar-sesion',
    failureFlash:true,
    badRequestMessage:'Ambos Campos son Obligatorios.'
});

// Función para revisar si el usuario esta Logueado o no.
exports.usuarioAutenticado=(req,res,next)=>{
    //Si el Usuario esta autenticado, adelante
    if(req.isAuthenticated()){
        return next();
    } 
    //Si no redirigir al formulario.
    return res.redirect('/iniciar-sesion');
}

//Funcion para Cerrar Sesion
exports.cerrarSesion=(req,res)=>{
    req.session.destroy(()=>{
        res.redirect('/iniciar-sesion');//al Cerrar redirecciona al Login 
    });
}

//genera Token si el Usuario es Valido
exports.enviarToken=async(req,res)=>{
    //Verificar que el usuario existe
    const {email}=req.body;
    const usuario=await Usuarios.findOne({where: {email}});

    //Si no existe Usuario
    if(!usuario){
        req.flash('error','No existe esa Cuenta');
        res.redirect('/reestablecer');
    }

    // usuario existe
    usuario.token=crypto.randomBytes(20).toString('hex');
    usuario.expiracion=Date.now()+3600000;

    //Guardar en la BD
    await usuario.save();

    //url de reset
    const resetUrl=`http://${req.headers.host}/reestablecer/${usuario.token}`;

    //Enviar el Correo con el Token
    await enviarEmail.enviar({
        usuario,
        subject:'Password Reset',
        resetUrl,
        archivo:'reestablecer-password'
    })

    //console.log(resetUrl);
    req.flash('correcto','Se envió un mensaje a Tu Correo.');
    res.redirect('/iniciar-sesion');
}

exports.validarToken=async(req,res)=>{
    const usuario=await Usuarios.findOne({
        where:{
            token:req.params.token  
        }
    });

    //Sino encuentra usuario
    if(!usuario){
        req.flash('error','No Válido');
        res.redirect('/reestablecer');    
    }

    //Formulario para Generar Password
    res.render('resetPassword',{
        nombrePagina:'Reestablecer Contraseña'
    });

}

//Cambia password por uno nuevo
exports.actualizarPassword=async(req,res)=>{
    
    //Verifica token valido pero tambien Fecha de Expiracion
    const usuario=await Usuarios.findOne({
        where:{
            token:req.params.token,
            expiracion:{
                [Op.gte]:Date.now()
            }
        }
    });

    //Verificamos si el Usuario existe
    if(!usuario){
        req.flash('error','No Válido.');
        res.redirect('/');
    }

    //Hashear el Nuevo Password
    usuario.password=bcrypt.hashSync(req.body.password,bcrypt.genSaltSync(10));
    usuario.token=null;
    usuario.expiracion=null;
    
    //Guardamos el nuevo Password
    await usuario.save();

    req.flash('correcto','Tu Password se ha modificado correctamente.');
    res.redirect('/iniciar-sesion');
}