const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());
const PORT = 9000;
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "burgertic",
});

connection.connect((err) => {
    if (err) {
        console.error("Error conectándose: " + err);
        return;
    }

    console.log("Base de datos conectada");
});
//Crear un endpoint GET /menu que devuelva el menú completo del restaurante.
app.get('/menu', (req, res) => {
    connection.query('SELECT * FROM platos', (err, rows) => {
        if (err) {
            console.error("Error consultando: " + err);
            return;
        }
        res.status(200).json(rows);
    });
});




//Crear un endpoint GET /menu/:id que devuelva el plato con el id indicado.
app.get('/menu/:id', (req, res) => {
    connection.query('SELECT * FROM platos WHERE id = ?', [req.params.id], (err, rows) => {
        if (err) {
            return res.status(500).json(err);
        }
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Plato no encontrado' });
        }
        res.status(200).json(rows[0]);
    });
});

//Crear un endpoint GET /combos que devuelva únicamente los combos del menú.
app.get('/combos', (req, res) => {
    connection.query('SELECT * FROM platos WHERE tipo = ?', ['combo'], (err, rows) => {
        if (err) {
            return res.status(500).json(err);
            
        }
        res.status(200).json(rows);
    });
});

//Crear un endpoint GET /principales que devuelva únicamente los platos principales del menú.
app.get('/principales', (req, res) => {
    connection.query('SELECT * FROM platos where tipo = ?',['principal'],(err,rows)=>{
        if(err){
            return res.status(500).json(err);
            
        }
        res.status(200).json(rows);
    });
});

//Crear un endpoint GET /postres que devuelva únicamente los postres del menú.
app.get('/postres', (req, res) => {
    connection.query('SELECT * FROM platos where tipo = ?',['postre'],(err,rows)=>{
        if(err){
            return res.status(500).json(err);
        }
        res.status(200).json(rows);
    });
});

//Crear un endpoint POST /pedido que reciba un array de id's de platos y devuelva el precio total del pedido. El array de platos debe ser pasado en el cuerpo de la petición. 

    app.post('/pedido', (req, res) => {
        const { productos } = req.body;
      
        if (!Array.isArray(productos) || productos.length === 0) {
          return res.status(400).json('La solicitud debe incluir un array de platos o al menos un plato');
        }
      
        connection.query('SELECT * FROM platos', (err, rows) => {
          if (err) {
            console.error('Error consultando: ' + err);
            return res.status(500).json({
              msg: 'Error al consultar los platos en la base de datos',
            });
          }
      
          const menu = rows.map((row) => ({
            id: row.id,
            precio: row.precio,
          }));
      
          let precioTotal = 0;
          let idsNoExistentes = [];
      
          productos.forEach((producto) => {
            let menuItem = menu.find((item) => item.id === producto.id);
      
            if (menuItem) {
              precioTotal += menuItem.precio * producto.cantidad;
            } else {
              idsNoExistentes.push(producto.id);
            }
          });
      
          if (idsNoExistentes.length > 0) {
            return res.status(400).json({
              msg: 'Los siguientes IDs no existen en el menú: ' + idsNoExistentes.join(', '),
            });
          }
      
          connection.query(
            'INSERT INTO pedidos (id_usuario, fecha) VALUES (?, ?)',
            [1, new Date()],
            (err, response) => {
              if (err) {
                console.error(err);
                return res.status(500).json({
                  msg: 'Error al crear el pedido' + err,
                });
              }
      
              const pedidoID = response.insertId;
      
              for (let i = 0; i < productos.length; i++) {
                connection.query(
                  'INSERT INTO pedidos_platos (id_pedido, id_plato, cantidad) VALUES (?, ?, ?)',
                  [pedidoID, productos[i].id, productos[i].cantidad],
                  (err) => {
                    if (err) {
                      console.error('Error al insertar plato en el pedido: ' + err);
                    }
                  }
                );
              }
      
              res.status(200).json({
                id: pedidoID,
              });
            }
          );
        });
      });
      

//Probar todos los endpoints creados utilizando REST Client.
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});