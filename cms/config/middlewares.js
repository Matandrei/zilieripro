module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: [
        'http://localhost:4200',   // dev Angular
        'https://ezilier.netlify.app', // prototip Netlify
        /\.netlify\.app$/,         // orice preview Netlify
      ],
      methods: ['GET', 'HEAD'],
      headers: ['Content-Type', 'Authorization'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
