export {};

import { initializeEmbeddedPanel } from './panel/embedded-panel';
import { setupMessageListener } from './utils';

setupMessageListener();
initializeEmbeddedPanel();
