import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env.config';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Smart Internal Operations System API',
      version: '1.0.0',
      description: 'Production-ready backend API documentation for internal operational workflows.',
    },
    servers: [
      {
        url: '/',
        description: 'Current Host (Dynamic)',
      },
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Localhost Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Input your JWT access token to authorize calls to protected API endpoints.',
        },
      },
    },
  },
  apis: ['./src/routes/**/*.ts', './src/modules/**/*.ts', './src/config/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
