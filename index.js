const express = require("express");
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;

const app = express();
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hm3ihus.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server
        await client.connect();

        const productsCollection = client.db("PM_ShoppingDB").collection("products");

        // Route to get products with filtering, sorting, and pagination
        app.get('/products', async (req, res) => {
            try {
                const page = parseInt(req.query.page) || 1;
                const limit = parseInt(req.query.limit) || 10;
                const skip = (page - 1) * limit;

                const { category, brandName, minPrice, maxPrice } = req.query;

                const query = {};

                if (category) {
                    query.category = category;
                }

                if (brandName) {
                    query.brandName = brandName;
                }

                if (minPrice && maxPrice) {
                    query.price = { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) };
                } else if (minPrice) {
                    query.price = { $gte: parseFloat(minPrice) };
                } else if (maxPrice) {
                    query.price = { $lte: parseFloat(maxPrice) };
                }

                // Fetch products with filters and pagination
                const productsCursor = productsCollection.find(query).skip(skip).limit(limit);
                const products = await productsCursor.toArray();

                const totalProducts = await productsCollection.countDocuments(query);

                res.json({
                    products,
                    totalProducts,
                    totalPages: Math.ceil(totalProducts / limit),
                    currentPage: page
                });
            } catch (error) {
                res.status(500).json({ message: 'Error fetching products', error });
            }
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Server is running");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
