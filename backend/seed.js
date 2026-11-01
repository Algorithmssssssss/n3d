const mongoose = require('mongoose');
const config = require('./config');
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');

// Loads sample categories/products. Safe to run on a live database: it does nothing
// if data already exists. Pass --reset to wipe users, categories and products first.
const RESET = process.argv.includes('--reset');

// Outside production, fall back to the old demo login so local development still works.
const ADMIN_EMAIL = config.adminEmail || (config.isProduction ? null : 'admin@textilepro.com');
const ADMIN_PASSWORD = config.adminPassword || (config.isProduction ? null : 'admin123');

const seedDatabase = async () => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    if (RESET) {
      await User.deleteMany({});
      await Category.deleteMany({});
      await Product.deleteMany({});
      console.log('🗑️  Existing users, categories and products removed (--reset)');
    }

    // Create admin user (only if there are no users yet)
    if (await User.countDocuments() === 0) {
      if (ADMIN_EMAIL && ADMIN_PASSWORD) {
        await User.create({
          email: ADMIN_EMAIL.trim().toLowerCase(),
          password: ADMIN_PASSWORD,
          name: 'Admin User',
          role: 'admin'
        });
        console.log('✅ Admin user created');
      } else {
        console.warn('⚠️  No admin created: set ADMIN_EMAIL and ADMIN_PASSWORD');
      }
    }

    if (await Category.countDocuments() > 0 || await Product.countDocuments() > 0) {
      console.log('ℹ️  Categories/products already exist - skipping sample data (use --reset to replace it)');
      process.exit(0);
    }

    // Create categories (with explicit slugs)
    const categoryData = [
      { name: 'Buttons', description: 'Various types of buttons for garments', icon: 'fas fa-circle', slug: 'buttons', sortOrder: 1 },
      { name: 'Collar Accessories', description: 'Collar stays, patches, and reinforcements', icon: 'fas fa-shirt', slug: 'collar-accessories', sortOrder: 2 },
      { name: 'Shirt Clips', description: 'U-shape and standard shirt clips', icon: 'fas fa-paperclip', slug: 'shirt-clips', sortOrder: 3 },
      { name: 'Packaging', description: 'Packaging solutions for garments', icon: 'fas fa-box', slug: 'packaging', sortOrder: 4 },
      { name: 'Labels & Tags', description: 'Clothing labels and price tags', icon: 'fas fa-tag', slug: 'labels-tags', sortOrder: 5 },
      { name: 'Threads & Zippers', description: 'Threads, zippers, and fasteners', icon: 'fas fa-scissors', slug: 'threads-zippers', sortOrder: 6 }
    ];
    const categories = await Category.insertMany(categoryData);
    console.log('✅ Categories created');

    // Create products (with explicit slugs)
    const productData = [
      {
        name: 'Wholesale Pearl Eco-Friendly Buttons',
        slug: 'wholesale-pearl-eco-friendly-buttons',
        description: 'High-quality pearl-like buttons made from eco-friendly materials. Perfect for shirts, blouses, and formal wear. Available in multiple sizes and colors.',
        shortDescription: 'Eco-friendly pearl buttons for formal wear',
        price: 0.02,
        priceRange: { min: 0.02, max: 0.05 },
        originalPrice: 0.04,
        category: categories[0]._id,
        minimumOrder: { quantity: 1000, unit: 'pieces' },
        stock: 100000,
        tags: ['buttons', 'eco-friendly', 'pearl', 'wholesale'],
        isFeatured: true,
        ecoFriendly: true,
        salesCount: 50000,
        specifications: [
          { name: 'Material', value: 'Eco-friendly Resin' },
          { name: 'Size', value: '10mm-30mm' },
          { name: 'Colors', value: 'White, Black, Pearl' }
        ]
      },
      {
        name: 'Modern Resin Buttons Beads for Clothing',
        slug: 'modern-resin-buttons-beads',
        description: 'Premium quality resin buttons with a modern design. Suitable for all types of clothing including jackets, coats, and casual wear.',
        shortDescription: 'Premium resin buttons for all clothing types',
        price: 0.01,
        originalPrice: 0.02,
        category: categories[0]._id,
        minimumOrder: { quantity: 1000, unit: 'pieces' },
        stock: 200000,
        tags: ['buttons', 'resin', 'modern', 'wholesale'],
        isFeatured: true,
        salesCount: 26000,
        specifications: [
          { name: 'Material', value: 'High-grade Resin' },
          { name: 'Size', value: '12mm-25mm' },
          { name: 'Colors', value: 'Various' }
        ]
      },
      {
        name: 'Collar Stays Collar Reinforcement Patch',
        slug: 'collar-stays-reinforcement-patch',
        description: 'Durable collar reinforcement patches that keep collars crisp and professional. Easy to apply and wash-resistant.',
        shortDescription: 'Collar reinforcement patches for crisp collars',
        price: 0.015,
        priceRange: { min: 0.01, max: 0.02 },
        category: categories[1]._id,
        minimumOrder: { quantity: 10000, unit: 'pieces' },
        stock: 500000,
        tags: ['collar', 'reinforcement', 'patches', 'professional'],
        isFeatured: true,
        ecoFriendly: true,
        salesCount: 100000,
        specifications: [
          { name: 'Material', value: 'Woven Fabric' },
          { name: 'Size', value: '70mm x 15mm' },
          { name: 'Color', value: 'White' }
        ]
      },
      {
        name: 'Eco-Friendly U-Shape 38mm PS Plastic Shirt Clips',
        slug: 'eco-friendly-u-shape-shirt-clips-38mm',
        description: 'Environmentally friendly U-shape shirt clips made from recycled PS plastic. Perfect for packaging and display.',
        shortDescription: 'Eco-friendly U-shape shirt clips',
        price: 0.01,
        category: categories[2]._id,
        minimumOrder: { quantity: 1000, unit: 'pieces' },
        stock: 300000,
        tags: ['clips', 'u-shape', 'eco-friendly', 'shirt'],
        isFeatured: true,
        ecoFriendly: true,
        salesCount: 150000,
        specifications: [
          { name: 'Material', value: 'PS Plastic (Recycled)' },
          { name: 'Size', value: '38mm' },
          { name: 'Color', value: 'Transparent' }
        ]
      },
      {
        name: 'Ming Bai Plastic U-Shape Eco-Friendly Shirt Clips',
        slug: 'ming-bai-plastic-u-shape-shirt-clips',
        description: 'High-quality U-shape shirt clips from Ming Bai brand. Durable, reusable, and environmentally conscious.',
        shortDescription: 'Ming Bai brand eco-friendly shirt clips',
        price: 0.008,
        priceRange: { min: 0.005, max: 0.01 },
        originalPrice: 0.015,
        category: categories[2]._id,
        minimumOrder: { quantity: 100, unit: 'pieces' },
        stock: 1000000,
        tags: ['clips', 'ming-bai', 'eco-friendly', 'u-shape'],
        salesCount: 130000,
        specifications: [
          { name: 'Material', value: 'Eco-friendly Plastic' },
          { name: 'Size', value: '38mm' },
          { name: 'Brand', value: 'Ming Bai' }
        ]
      },
      {
        name: 'Shirt Packaging Kit Waterproof',
        slug: 'shirt-packaging-kit-waterproof',
        description: 'Complete waterproof packaging solution for shirts. Includes transparent bag and cardboard insert. Keeps shirts clean and presentable.',
        shortDescription: 'Waterproof shirt packaging solution',
        price: 0.10,
        priceRange: { min: 0.09, max: 0.12 },
        originalPrice: 0.15,
        category: categories[3]._id,
        minimumOrder: { quantity: 100, unit: 'pieces' },
        stock: 50000,
        tags: ['packaging', 'waterproof', 'shirt', 'kit'],
        isFeatured: true,
        salesCount: 5000,
        specifications: [
          { name: 'Material', value: 'PE + Cardboard' },
          { name: 'Size', value: 'Fits M-XXL shirts' },
          { name: 'Features', value: 'Waterproof, Resealable' }
        ]
      },
      {
        name: 'Wholesale Botones Custom Pearl Eco-Friendly',
        slug: 'wholesale-botones-custom-pearl',
        description: 'Custom pearl buttons with your brand logo. Premium quality with eco-friendly materials. Perfect for branded clothing lines.',
        shortDescription: 'Custom branded pearl buttons',
        price: 1.44,
        originalPrice: 1.89,
        category: categories[0]._id,
        minimumOrder: { quantity: 1000, unit: 'pieces' },
        stock: 10000,
        tags: ['buttons', 'custom', 'branded', 'pearl', 'premium'],
        ecoFriendly: true,
        salesCount: 2000,
        specifications: [
          { name: 'Material', value: 'Premium Pearl Resin' },
          { name: 'Customization', value: 'Logo Engraving' },
          { name: 'MOQ', value: '1000 pieces' }
        ]
      },
      {
        name: 'Hot-melt Adhesive Mesh Film Double-sided',
        slug: 'hot-melt-adhesive-mesh-film',
        description: 'Professional-grade hot-melt adhesive mesh film for bonding fabric layers. Double-sided for secure adhesion.',
        shortDescription: 'Double-sided adhesive mesh film',
        price: 0.60,
        priceRange: { min: 0.09, max: 1.16 },
        originalPrice: 1.45,
        category: categories[3]._id,
        minimumOrder: { quantity: 2, unit: 'rolls' },
        stock: 5000,
        tags: ['adhesive', 'mesh', 'film', 'bonding'],
        salesCount: 800,
        specifications: [
          { name: 'Type', value: 'Hot-melt Adhesive' },
          { name: 'Width', value: '15cm / 20cm / 30cm' },
          { name: 'Length', value: '10m / 25m / 50m' }
        ]
      },
      {
        name: 'Eco-friendly Detachable PVC Transparent Collar',
        slug: 'eco-friendly-detachable-pvc-collar',
        description: 'Transparent detachable collar protectors made from eco-friendly PVC. Keeps collars clean during storage and transport.',
        shortDescription: 'Eco-friendly transparent collar protectors',
        price: 0.02,
        priceRange: { min: 0.02, max: 0.03 },
        category: categories[1]._id,
        minimumOrder: { quantity: 500, unit: 'pieces' },
        stock: 200000,
        tags: ['collar', 'protector', 'transparent', 'eco-friendly'],
        ecoFriendly: true,
        salesCount: 45000,
        specifications: [
          { name: 'Material', value: 'Eco-friendly PVC' },
          { name: 'Size', value: 'One Size Fits All' },
          { name: 'Feature', value: 'Detachable, Reusable' }
        ]
      },
      {
        name: 'Premium Brand Experienced Collar Clips',
        slug: 'premium-brand-collar-clips',
        description: 'Premium quality collar clips from an experienced manufacturer. Durable construction with a professional finish.',
        shortDescription: 'Premium collar clips from expert manufacturer',
        price: 0.015,
        priceRange: { min: 0.01, max: 0.02 },
        category: categories[1]._id,
        minimumOrder: { quantity: 1000, unit: 'pieces' },
        stock: 150000,
        tags: ['collar', 'clips', 'premium', 'professional'],
        salesCount: 35000,
        specifications: [
          { name: 'Material', value: 'High-grade Plastic' },
          { name: 'Size', value: 'Standard' },
          { name: 'Quality', value: 'Premium Grade' }
        ]
      }
    ];

    await Product.insertMany(productData);
    console.log('✅ Products created');

    console.log('\n🎉 Database seeded successfully!');
    if (ADMIN_EMAIL) {
      console.log(`\n📋 Admin login: ${ADMIN_EMAIL} (password: the ADMIN_PASSWORD you configured)`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
