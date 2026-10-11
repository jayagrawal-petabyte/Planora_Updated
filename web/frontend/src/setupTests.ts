import '@testing-library/jest-dom';
// @ts-ignore
import { TextEncoder, TextDecoder } from 'util';

// @ts-ignore
Object.assign(global, { TextDecoder, TextEncoder });
