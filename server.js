/* eslint-disable no-shadow */
/* eslint-disable no-unused-vars */
const http = require('http');
const path = require('path');
const Koa = require('koa');
const cors = require('koa2-cors');
const koaBody = require('koa-body');
const koaStatic = require('koa-static');
const Router = require('koa-router');
const fs = require('fs');

const categories = JSON.parse(fs.readFileSync('./data/categories.json'));
const items = JSON.parse(fs.readFileSync('./data/products.json'));
const topSaleIds = [66, 65, 73];
const moreCount = 6;

const itemBasicMapper = (item) => ({
  id: item.id,
  category: item.category,
  title: item.title,
  price: item.price,
  images: item.images,
});

// const randomNumber = (start, stop) => Math.floor(Math.random() * (stop - start + 1)) + start;

const fortune = (ctx, body = null, status = 200) => {
  // Uncomment for delay
  // const delay = randomNumber(1, 3) * 1000;
  const delay = 0;
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Uncomment for error generation
      // if (Math.random() > 0.8) {
      //   reject(new Error('Something bad happened'));
      //   return;
      // }

      ctx.response.status = status;
      ctx.response.body = body;
      resolve();
    }, delay);
  });
};

const app = new Koa();

app.use(
  cors({
    origin: '*',
    credentials: true,
    'Access-Control-Allow-Origin': true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  }),
);

app.use(koaBody({
  text: true,
  urlencoded: true,
  multipart: true,
  json: true,
}));

const dirPublic = path.join(__dirname, '/public');
app.use(koaStatic(dirPublic));

const router = new Router();
app.use(router.routes()).use(router.allowedMethods());

router.get('/api/top-sales', async (ctx, next) => fortune(ctx, items.filter((o) => topSaleIds.includes(o.id)).map(itemBasicMapper)));

router.get('/api/categories', async (ctx, next) => fortune(ctx, categories));

router.get('/api/items', async (ctx, next) => {
  const { query } = ctx.request;

  const categoryId = query.categoryId === undefined ? 0 : Number(query.categoryId);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  const q = query.q === undefined ? '' : query.q.trim().toLowerCase();

  const filtered = items
    .filter((o) => categoryId === 0 || o.category === categoryId)
    .filter((o) => o.title.toLowerCase().includes(q) || o.color.toLowerCase() === q)
    .slice(offset, offset + moreCount)
    .map(itemBasicMapper);

  return fortune(ctx, filtered);
});

router.get('/api/items/:id', async (ctx, next) => {
  const id = Number(ctx.params.id);
  const item = items.find((o) => o.id === id);
  if (item === undefined) {
    return fortune(ctx, 'Not found', 404);
  }

  return fortune(ctx, item);
});

router.post('/api/order', async (ctx, next) => {
  const { owner: { phone, address }, items } = ctx.request.body;
  if (typeof phone !== 'string') {
    return fortune(ctx, 'Bad Request: Phone', 400);
  }
  if (typeof address !== 'string') {
    return fortune(ctx, 'Bad Request: Address', 400);
  }
  if (!Array.isArray(items)) {
    return fortune(ctx, 'Bad Request: Items', 400);
  }
  if (!items.every(({ id, price, count }) => {
    if (typeof id !== 'number' || id <= 0) {
      return false;
    }
    if (typeof price !== 'number' || price <= 0) {
      return false;
    }
    if (typeof count !== 'number' || count <= 0) {
      return false;
    }
    return true;
  })) {
    return fortune(ctx, 'Bad Request', 400);
  }

  return fortune(ctx, null, 204);
});

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());

// eslint-disable-next-line no-console
server.listen(port, () => console.log('Server started'));
