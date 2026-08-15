/**
 * The single module the server loads to seed an empty database.
 *
 * Kept separate so the seeder pulls in the data and nothing else — no React,
 * no CSS, no components.
 */
export { products } from './products'
export { families, categories } from './taxonomy'
