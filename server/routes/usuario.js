const express = require('express');
const bcrypt = require('bcryptjs');
const _ = require('underscore');
const Usuario = require('../models/usuario');
const { verificaToken, verificaAdmin_Role } = require('../middlewares/autenticacion');

const app = express();

app.get('/usuario', verificaToken, (req, res) => {
    // res.json('get Usuario Local!');

    return res.json({
        usuario: req.usuario,
        nombre: req.usuario.nombre,
        email: req.usuario.email
    });

    let desde = req.query.desde || 0;
    desde = Number(desde); //se convierte a number porque toma como string

    let limite = req.query.limite || 5;
    limite = Number(limite); //se convierte a number porque toma como string

    Usuario.find({ estado: true }, 'nombre email role estado google img') //segundo argumento entre comillas para mostrar solamente esos campos
        .skip(desde) // para decir desde que registro mostrar
        .limit(limite) // limite de registros a mostrar
        .exec((err, usuarios) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    err
                });
            }

            Usuario.count({ estado: true }, (err, conteo) => { //para contar la cantidad total de registros
                res.json({
                    ok: true,
                    usuarios,
                    cuantos: conteo
                });
            });


        });
});

app.post('/usuario', [verificaToken, verificaAdmin_Role], function(req, res) {

    let body = req.body;

    let usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        role: body.role
    });

    usuario.save((err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        // usuarioDB.password = null;

        res.json({
            ok: true,
            usuario: usuarioDB
        });
    });


});

app.put('/usuario/:id', [verificaToken, verificaAdmin_Role], function(req, res) {

    let id = req.params.id;
    let body = _.pick(req.body, ['nombre', 'email', 'img', 'role', 'estado']);

    Usuario.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, usuarioDB) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }


        res.json({
            ok: true,
            usuario: usuarioDB
        });

    })
});

app.delete('/usuario/:id', [verificaToken, verificaAdmin_Role], function(req, res) {
    // res.json('delete Usuario')

    let id = req.params.id; //para obtener el id a eliminar

    let cambiaEstado = {
        estado: false
    };

    // Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {
    Usuario.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, usuarioBorrado) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        };

        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                err: {
                    messaje: 'Usuario no encontrado'
                }
            });
        }

        res.json({
            ok: true,
            usuario: usuarioBorrado
        });
    });


});

module.exports = app;