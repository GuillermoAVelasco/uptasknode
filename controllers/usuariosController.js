const Usuarios=require('../models/Usuarios');
const enviarEmail=require('../handlers/email');

exports.formCrearCuenta=(req,res)=>{
    res.render('crearCuenta',{
        nombrePagina:'Crear Cuenta en Uptask.'
    });
} ;

exports.formIniciarSesion=(req,res)=>{
    const {error}=res.locals.mensajes;
    res.render('iniciarSesion',{
        nombrePagina:'Iniciar Sesión en Uptask.',
        error
    });
} ;

exports.crearCuenta=async(req,res)=>{
    //Leer datos
    const {email,password}=req.body;
    try{
        //Crear Usuarios
        await Usuarios.create({
            email,
            password
        });

        //Crear una URL de Confirmar
        const confirmarUrl=`http://${req.headers.host}/confirmar/${email}`;

        //Crear el Objeto de Usuario
        const usuario={
            email
        }

        //Enviar Email
        await enviarEmail.enviar({
            usuario,
            subject:'Confirma tu Cuenta Uptask',
            confirmarUrl,
            archivo:'confirmar-cuenta'
        })

        //Redirigir al Usuario
        req.flash('correcto','Enviamos un correo, confirma tu cuenta.');
        res.redirect('/iniciar-sesion');
    }
    catch(error){
        req.flash('mensajes',error.errors.map(error=>error.message));
        res.render('crearCuenta',{
            mensajes:req.flash(),
            nombrePagina:'Crear Cuenta en Uptask.',
            email,
            password
        })
    }
}

exports.formReestablecerPassword=(req,res)=>{
    res.render('reestablecer',{
        nombrePagina:'Reestablecer tu Contraseña'
    });
}

//Cambia el estado de una Cuenta
exports.confirmarCuenta=async(req,res)=>{
    const usuario=await Usuarios.findOne({
        email:req.params.correo
    });

    //Si no existe usuario
    if(!usuario){
        req.flash('error','No válido.');
        res.redirect('/crear-cuenta');
    }

    usuario.activo=1;
    await usuario.save();

    req.flash('correcto','Cuenta Activada Correctamente.');
    res.redirect('/iniciar-sesion');
}