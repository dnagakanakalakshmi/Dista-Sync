import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcrypt';
import fetch from 'node-fetch';

dotenv.config();

// Mongo connection
const MONGO_URI =
  process.env.MONGO_URI;

mongoose
  .connect(MONGO_URI, { dbName: 'DistaApps' })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Mongo connection error:', err);
    process.exit(1);
  });

// Schemas (matching provided models, plus a simple user store for auth)
const sessionSchema = new mongoose.Schema(
  {
    session_id: { type: mongoose.Schema.Types.ObjectId, alias: '_id' },
    id: { type: String, unique: true },
    shop: String,
    state: String,
    isOnline: { type: Boolean, default: false },
    scope: String,
    expires: Date,
    accessToken: String,
    userId: String,
    firstName: String,
    lastName: String,
    email: String,
    accountOwner: { type: Boolean, default: false },
    locale: String,
    collaborator: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
  },
  { collection: 'Session' }
);

const onboardingSchema = new mongoose.Schema(
  {
    shop: String,
    adminEmail: String,
    completed: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'Onboarding' }
);

// Lightweight user store to keep password hashes
const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    // Legacy single store string
    store: { type: String },
    // New format: array of stores or raw JSON string
    stores: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true, collection: 'Users' }
);

const Session = mongoose.model('Session', sessionSchema);
const Onboarding = mongoose.model('Onboarding', onboardingSchema);
const User = mongoose.model('User', userSchema);

const SHOPIFY_API_VERSION = '2023-07';

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ email, passwordHash });
    res.json({ message: 'Registered successfully' });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Try to surface the store from onboarding (if completed) for UI display purposes
    const onboarding = await Onboarding.findOne({ adminEmail: email, completed: true }).sort({ updatedAt: -1 });

    res.json({ email: user.email, store: onboarding?.shop || '' });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ message: 'Login failed' });
  }
});

const shopifyQuery = async (shop, token, query) => {
  const url = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error('[SHOPIFY] HTTP error', resp.status, text);
    throw new Error(`Shopify error ${resp.status}`);
  }

  const json = await resp.json();
  if (json.errors) {
    console.error('[SHOPIFY] GraphQL errors', json.errors);
    throw new Error('Shopify GraphQL errors');
  }
  return json.data;
};

const shopifyMutation = async (shop, token, query, variables) => {
  const url = `https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error('[SHOPIFY] HTTP error', resp.status, text);
    throw new Error(`Shopify error ${resp.status}`);
  }

  const json = await resp.json();
  if (json.errors) {
    console.error('[SHOPIFY] GraphQL errors', json.errors);
    throw new Error('Shopify GraphQL errors');
  }
  return json.data;
};

const fetchShopifyData = async (shop, token) => {
  const ordersQuery = `
    {
      orders(first: 20, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            displayFulfillmentStatus
            displayFinancialStatus
            cancelReason
            cancelledAt
            totalPriceSet { shopMoney { amount currencyCode } }
            customer { displayName email }
            lineItems(first: 50) {
              edges {
                node {
                  id
                  title
                  quantity
                  variant {
                    id
                    price
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const productsQuery = `
    {
      products(first: 50, sortKey: TITLE) {
        edges {
          node {
            id
            title
            totalInventory
            variants(first: 100) { 
              edges { 
                node { 
                  id 
                  title
                  price 
                  inventoryQuantity
                  inventoryItem {
                    id
                    inventoryLevels(first: 1) {
                      edges {
                        node {
                          id
                          location {
                            id
                            name
                          }
                          quantities(names: ["available"]) {
                            name
                            quantity
                          }
                        }
                      }
                    }
                  }
                } 
              } 
            }
          }
        }
      }
    }
  `;

  const inventoryQuery = `
    {
      inventoryItems(first: 50) {
        edges {
          node {
            id
            sku
            tracked
            variant {
              id
              title
              product {
                id
                title
              }
            }
            inventoryLevels(first: 3) {
              edges {
                node {
                  id
                  quantities(names: ["available"]) {
                    name
                    quantity
                  }
                  location { id name }
                  item { id }
                }
              }
            }
          }
        }
      }
    }
  `;

  const [ordersData, productsData, inventoryData] = await Promise.all([
    shopifyQuery(shop, token, ordersQuery),
    shopifyQuery(shop, token, productsQuery),
    shopifyQuery(shop, token, inventoryQuery),
  ]);

  const orders =
    ordersData?.orders?.edges?.map(({ node }) => {
      const isCancelled = Boolean(node.cancelledAt || node.cancelReason);
      const displayStatus = isCancelled
        ? 'CANCELLED'
        : node.displayFulfillmentStatus || node.displayFinancialStatus || '—';

      const lineItems = node.lineItems?.edges?.map(({ node: item }) => ({
        id: item.id?.split('/').pop() || item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.variant?.price || '—',
      })) || [];

      return {
        orderId: node.id,
        id: node.name,
        customer: node.customer?.displayName || 'Unknown',
        total: node.totalPriceSet?.shopMoney
          ? `${node.totalPriceSet.shopMoney.amount} ${node.totalPriceSet.shopMoney.currencyCode}`
          : '—',
        status: displayStatus,
        lineItems,
      };
    }) || [];

  const products =
    productsData?.products?.edges?.flatMap(({ node }) => {
      const variants = node.variants?.edges || [];
      
      // If product has variants, create a row for each variant
      if (variants.length > 0) {
        return variants.map(({ node: variant }) => {
          const inventoryLevel = variant.inventoryItem?.inventoryLevels?.edges?.[0]?.node;
          return {
            id: variant.id?.split('/').pop(),
            productId: node.id,
            variantId: variant.id,
            title: node.title,
            variantTitle: variant.title,
            displayTitle: variant.title !== 'Default Title' 
              ? `${node.title} - ${variant.title}` 
              : node.title,
            price: variant.price || '—',
            inventory: inventoryLevel?.quantities?.[0]?.quantity ?? variant.inventoryQuantity ?? '—',
            inventoryItemId: variant.inventoryItem?.id,
            locationId: inventoryLevel?.location?.id,
            locationName: inventoryLevel?.location?.name,
          };
        });
      }
      
      // If no variants, create a single row for the product
      return [{
        id: node.id?.split('/').pop(),
        productId: node.id,
        variantId: null,
        title: node.title,
        variantTitle: null,
        displayTitle: node.title,
        price: '—',
        inventory: node.totalInventory ?? '—',
      }];
    }) || [];

  const inventory =
    inventoryData?.inventoryItems?.edges
      ?.flatMap(({ node }) =>
        (node.inventoryLevels?.edges || []).map((lvl) => {
          const productTitle = node.variant?.product?.title || 'Unknown Product';
          const variantTitle = node.variant?.title;
          const displayTitle = variantTitle && variantTitle !== 'Default Title'
            ? `${productTitle} - ${variantTitle}`
            : productTitle;
          return {
            title: displayTitle,
            sku: node.sku || '—',
            location: lvl.node?.location?.name || '—',
            qty:
              lvl.node?.quantities?.find((q) => q.name === 'available')?.quantity ??
              lvl.node?.quantities?.[0]?.quantity ??
              '—',
            itemId: node.id,
            locationId: lvl.node?.location?.id,
          };
        })
      ) || [];

  return { orders, products, inventory };
};

const resolveSession = async (email, storeQuery) => {
  if (!email) throw new Error('Email is required');

  // Prefer explicit store, otherwise fall back to the latest onboarded shop for this email
  let onboarding;
  if (storeQuery) {
    onboarding = await Onboarding.findOne({ adminEmail: email, shop: storeQuery, completed: true });
  } else {
    onboarding = await Onboarding.findOne({ adminEmail: email, completed: true }).sort({ updatedAt: -1 });
  }

  const store = storeQuery || onboarding?.shop;
  if (!store || !onboarding) {
    throw new Error('Onboarded store not found for this email');
  }

  const session =
    (await Session.findOne({ shop: store, email })) || (await Session.findOne({ shop: store }));
  if (!session || !session.accessToken) throw new Error('Token missing; install Shopify app to access data');
  return { store, token: session.accessToken };
};

// Data fetch endpoint: finds stores from Users database and fetches data using Session tokens
app.get('/api/data', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Check if user is registered in Users collection
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register first.' });
    }

    // Get stores from user record - handle both old format (store) and new format (stores)
    let userStores = [];
    if (user.stores) {
      // Accept both stored JSON string and direct array
      if (Array.isArray(user.stores)) {
        userStores = user.stores;
      } else {
        try {
          userStores = JSON.parse(user.stores);
        } catch (err) {
          console.error('Error parsing user.stores:', err, 'value:', user.stores);
        }
      }
    } else if (user.store) {
      // Old format: single store string
      userStores = [user.store];
    }

    if (userStores.length === 0) {
      console.warn('[DATA] No stores extracted from Users record', user.email, 'raw stores:', user.stores, 'raw store:', user.store);
    }

    if (userStores.length === 0) {
      // Fallback: derive stores from completed onboardings for this email
      const onboarded = await Onboarding.find({ adminEmail: email, completed: true }).sort({ updatedAt: -1 });
      userStores = onboarded.map((o) => o.shop).filter(Boolean);
    }

    if (userStores.length === 0) {
      return res.status(403).json({
        message: 'No stores found for this user. Please link a store first.',
      });
    }

    // Group data by store instead of aggregating
    const stores = [];

    for (const store of userStores) {
      try {
        // Find session for this store
        const session =
          (await Session.findOne({ shop: store, email })) || 
          (await Session.findOne({ shop: store }));

        if (!session || !session.accessToken) {
          console.warn(`Token missing for store ${store}, skipping`);
          continue;
        }

        // Fetch Shopify data for this store
        const shopifyData = await fetchShopifyData(store, session.accessToken);

        // Store data grouped by shop
        stores.push({
          shop: store,
          token: session.accessToken,
          orders: shopifyData.orders || [],
          products: shopifyData.products || [],
          inventory: shopifyData.inventory || [],
        });
      } catch (err) {
        console.error(`Error fetching data for store ${store}:`, err);
      }
    }

    res.json({ stores });
  } catch (err) {
    console.error('Data fetch error', err);
    res.status(500).json({ message: 'Failed to fetch data' });
  }
});

// Update product title/price (uses first variant id)
app.post('/api/products/update', async (req, res) => {
  try {
    const { email, store, productId, variantId, title, price } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const { store: shop, token } = await resolveSession(email, store);

    if (title) {
      const mutation = `
        mutation productUpdate($input: ProductInput!) {
          productUpdate(input: $input) {
            product { id title }
            userErrors { field message }
          }
        }
      `;
      const data = await shopifyMutation(shop, token, mutation, { input: { id: productId, title } });
      const errors = data?.productUpdate?.userErrors;
      if (errors && errors.length) return res.status(400).json({ message: errors[0].message });
    }

    if (price && variantId) {
      const mutation = `
        mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $productId, variants: $variants) {
            product { id }
            userErrors { field message }
          }
        }
      `;
      const data = await shopifyMutation(shop, token, mutation, {
        productId,
        variants: [{ id: variantId, price }],
      });
      const errors = data?.productVariantsBulkUpdate?.userErrors;
      if (errors && errors.length) return res.status(400).json({ message: errors[0].message });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Product update error', err);
    res.status(500).json({ message: 'Failed to update product' });
  }
});

// Update order fulfillment status
app.post('/api/orders/update', async (req, res) => {
  try {
    const { email, store, orderId, status } = req.body;
    if (!orderId || !status) {
      return res.status(400).json({ message: 'orderId and status are required' });
    }
    const { store: shop, token } = await resolveSession(email, store);

    // Handle order cancellation
    if (status === 'CANCELLED') {
      const mutation = `
        mutation orderCancel($orderId: ID!, $refund: Boolean!, $restock: Boolean!, $reason: OrderCancelReason!) {
          orderCancel(orderId: $orderId, refund: $refund, restock: $restock, reason: $reason) {
            userErrors { field message }
          }
        }
      `;
      const data = await shopifyMutation(shop, token, mutation, {
        orderId: orderId,
        refund: false,
        restock: true,
        reason: "CUSTOMER",
      });
      const errors = data?.orderCancel?.userErrors;
      if (errors && errors.length) return res.status(400).json({ message: errors[0].message });
      return res.json({ ok: true, message: 'Order cancelled successfully' });
    }

    // For other status changes, we would need fulfillment APIs
    // For now, return a message
    res.json({ ok: true, message: `Order status update to ${status} is not yet implemented` });
  } catch (err) {
    console.error('Order update error', err);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

// Adjust inventory quantity (delta based) using inventoryAdjustQuantities
app.post('/api/inventory/update', async (req, res) => {
  try {
    const { email, store, itemId, locationId, newQty, currentQty } = req.body;
    if (!itemId || !locationId || newQty === undefined || currentQty === undefined) {
      return res
        .status(400)
        .json({ message: 'itemId, locationId, newQty, and currentQty are required' });
    }
    const delta = Number(newQty) - Number(currentQty);
    const { store: shop, token } = await resolveSession(email, store);

    const mutation = `
      mutation inventoryAdjustQuantities($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) {
          inventoryAdjustmentGroup {
            reason
            changes {
              name
              delta
            }
          }
          userErrors { field message }
        }
      }
    `;
    const data = await shopifyMutation(shop, token, mutation, {
      input: {
        reason: "correction",
        name: "available",
        changes: [
          {
            inventoryItemId: itemId,
            locationId,
            delta,
          },
        ],
      },
    });
    const errors = data?.inventoryAdjustQuantities?.userErrors;
    if (errors && errors.length) return res.status(400).json({ message: errors[0].message });

    res.json({ ok: true });
  } catch (err) {
    console.error('Inventory update error', err);
    res.status(500).json({ message: 'Failed to update inventory' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API server running on http://localhost:${PORT}`));

