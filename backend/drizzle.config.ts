import { defineConfig } from 'drizzle-kit'
import ENV from './src/config/ENV.ts'

export default defineConfig({
	schema: './src/models/**/*.ts',
	out: './migrations',
	dialect: 'postgresql',
	dbCredentials: {
		url: ENV.DATABASE_URL
	}
})
