const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'shopease',
  password: '1234',
  port: 5432,
});

// Middleware
app.use(bodyParser.json());

// Swagger definition
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Sales and Products API',
      version: '1.0.0',
      description: 'API documentation for Sales and Products management',
    },
    servers: [
      {
        url: `http://localhost:${port}`,
        description: 'Local server',
      },
    ],
  },
  apis: ['app.js'], // File containing routes
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger UI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - product_name
 *         - price
 *         - category
 *       properties:
 *         product_id:
 *           type: integer
 *         product_name:
 *           type: string
 *         price:
 *           type: number
 *           format: float
 *         category:
 *           type: string
 *       example:
 *         product_name: Laptop
 *         price: 1200.00
 *         category: Electronics
 */

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API endpoints for managing products
 */

// Routes for products

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Retrieve all products
 *     tags: [Products]
 *     responses:
 *       '200':
 *         description: A list of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/products', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /products/{product_id}:
 *   get:
 *     summary: Retrieve a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the product to retrieve
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       '404':
 *         description: Product not found
 */
app.get('/products/:product_id', async (req, res) => {
  const { product_id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE product_id = $1', [product_id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a new product
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 */
app.post('/products', async (req, res) => {
  const { product_name, price, category } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO products (product_name, price, category) VALUES ($1, $2, $3) RETURNING *',
      [product_name, price, category]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /products/{product_id}:
 *   put:
 *     summary: Update an existing product
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the product to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       '200':
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       '404':
 *         description: Product not found
 */
app.put('/products/:product_id', async (req, res) => {
  const { product_id } = req.params;
  const { product_name, price, category } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE products SET product_name = $1, price = $2, category = $3 WHERE product_id = $4 RETURNING *',
      [product_name, price, category, product_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /products/{product_id}:
 *   delete:
 *     summary: Delete a product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: product_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the product to delete
 *     responses:
 *       '204':
 *         description: No Content
 *       '404':
 *         description: Product not found
 */
app.delete('/products/:product_id', async (req, res) => {
  const { product_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE product_id = $1', [product_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.sendStatus(204);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       required:
 *         - customer_id
 *         - product_id
 *         - quantity
 *       properties:
 *         sale_id:
 *           type: integer
 *         customer_id:
 *           type: integer
 *         product_id:
 *           type: integer
 *         quantity:
 *           type: integer
 *       example:
 *         customer_id: 1
 *         product_id: 1
 *         quantity: 2
 */

/**
 * @swagger
 * tags:
 *   name: Sales
 *   description: API endpoints for managing sales
 */

// Routes for sales

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Retrieve all sales
 *     tags: [Sales]
 *     responses:
 *       '200':
 *         description: A list of sales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sale'
 */
app.get('/sales', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM sales');
    res.json(rows);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /sales/{sale_id}:
 *   get:
 *     summary: Retrieve a sale by ID
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: sale_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the sale to retrieve
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sale'
 *       '404':
 *         description: Sale not found
 */
app.get('/sales/:sale_id', async (req, res) => {
  const { sale_id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM sales WHERE sale_id = $1', [sale_id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Create a new sale
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Sale'
 *     responses:
 *       '201':
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sale'
 */
app.post('/sales', async (req, res) => {
  const { customer_id, product_id, quantity } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO sales (customer_id, product_id, quantity) VALUES ($1, $2, $3) RETURNING *',
      [customer_id, product_id, quantity]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /sales/{sale_id}:
 *   put:
 *     summary: Update an existing sale
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: sale_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the sale to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Sale'
 *     responses:
 *       '200':
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sale'
 *       '404':
 *         description: Sale not found
 */
app.put('/sales/:sale_id', async (req, res) => {
  const { sale_id } = req.params;
  const { customer_id, product_id, quantity } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE sales SET customer_id = $1, product_id = $2, quantity = $3 WHERE sale_id = $4 RETURNING *',
      [customer_id, product_id, quantity, sale_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /sales/{sale_id}:
 *   delete:
 *     summary: Delete a sale by ID
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: sale_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the sale to delete
 *     responses:
 *       '204':
 *         description: No Content
 *       '404':
 *         description: Sale not found
 */
app.delete('/sales/:sale_id', async (req, res) => {
  const { sale_id } = req.params;
  try {
    const result = await pool.query('DELETE FROM sales WHERE sale_id = $1', [sale_id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    res.sendStatus(204);
  } catch (err) {
    console.error('Error executing query', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
