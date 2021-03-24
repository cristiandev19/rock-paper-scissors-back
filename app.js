const express    = require('express');

const app        = express();

const httpServer = require('http').createServer(app);

const options = {
  cors: {
    origin: '*',
  },
};
const io = require('socket.io')(httpServer, options);

const cors       = require('cors');
const bodyParser = require('body-parser');
const passport      = require('passport');

const { dbConnection } = require('./src/databases/mongodb');
const { config } = require('./src/config/index');

// passport stuff
const jwtStrategry  = require('./src/strategies/jwt');

passport.use(jwtStrategry);

// Hacemos la conexion a mongodb
dbConnection();

// Importamos los middlewares para manejar los errores
const { logErrors, errorHandler } = require('./src/utils/middleware/errorHandler');

// Aqui configuraciones
app
  .use(cors({ origin: '*' }))
  .use(bodyParser.urlencoded({ limit: '5mb', extended: true }))
  .use(bodyParser.json({ limit: '5mb' }));

// Importamos modulos
const exampleRouter = require('./src/modules/example/example.router');
const authRouter = require('./src/modules/auth/auth.router');
// Establecemos las rutas
app
  .use('/example', exampleRouter)
  .use('/auth', authRouter);

// Middleware para manejo de errores
app
  .use(logErrors)
  .use(errorHandler);

let interval;

const getApiAndEmit = (socket) => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit('FromAPI', response);
};

io.on('connection', (socket) => {
  console.log('new client of the socket');
  /* ... */
  if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
  socket.on('eventA', (inter) => {
    console.log('client is subscribing to timer with interval ', inter);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

console.log('config.port', config.port);
httpServer.listen(config.port);

// app.listen(config.port, () => {
//   console.log(`Example app listening at http://localhost:${config.port}`);
// });
