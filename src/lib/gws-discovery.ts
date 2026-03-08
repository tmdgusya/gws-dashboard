import { execSync } from 'child_process';

/**
 * Service represents a Google Workspace service like 'drive', 'gmail', etc.
 */
export interface Service {
  id: string;
  name: string;
  description: string;
}

/**
 * Resource represents an API resource like 'files', 'messages', 'events'.
 * Resources can contain sub-resources (e.g., 'gmail.users.labels').
 */
export interface Resource {
  id: string;
  name: string;
  description: string;
  subResources: Resource[];
  methods: string[];
}

/**
 * Method represents a specific API call like 'list', 'get', 'create'.
 */
export interface Method {
  id: string;
  name: string;
  description: string;
}

/**
 * Full discovery tree.
 */
export interface DiscoveryTree {
  services: Service[];
}

export function getHelp(commandParts: string[]): string {
  try {
    const helpCmd = ['gws', ...commandParts, '--help'].join(' ');
    // Use ignore for stdin and stderr to avoid being noisy
    return execSync(helpCmd, { 
      encoding: 'utf-8', 
      stdio: ['ignore', 'pipe', 'ignore'],
      env: { ...process.env, COLUMNS: '1000' } // Ensure long lines aren't truncated
    });
  } catch (error) {
    // console.error(`Error fetching help for ${commandParts.join(' ')}:`, error);
    return '';
  }
}

/**
 * Parses the top-level gws help to find all services.
 */
export function getServices(): Service[] {
  const helpOutput = getHelp([]);
  const services: Service[] = [];
  const lines = helpOutput.split('\n');
  let inServicesSection = false;

  for (const line of lines) {
    if (line.trim().startsWith('SERVICES:')) {
      inServicesSection = true;
      continue;
    }
    if (inServicesSection && line.trim().startsWith('ENVIRONMENT:')) {
      inServicesSection = false;
      break;
    }
    if (inServicesSection && line.trim().length > 0) {
      // Example: "    drive                Manage files, folders, and shared drives"
      const match = line.match(/^\s*([a-z0-9-]+)\s+(.*)$/);
      if (match) {
        services.push({
          id: match[1],
          name: match[1].charAt(0).toUpperCase() + match[1].slice(1),
          description: match[2].trim(),
        });
      }
    }
  }
  return services;
}

/**
 * Parses help for a service or resource to find children (resources and methods).
 */
export function getChildren(commandParts: string[]): { resources: Resource[]; methods: Method[] } {
  const helpOutput = getHelp(commandParts);
  const lines = helpOutput.split('\n');
  let inCommandsSection = false;
  const resources: Resource[] = [];
  const methods: Method[] = [];

  for (const line of lines) {
    if (line.trim().startsWith('Commands:')) {
      inCommandsSection = true;
      continue;
    }
    if (inCommandsSection && line.trim().length === 0) {
      continue;
    }
    if (inCommandsSection && line.trim().startsWith('Options:')) {
      inCommandsSection = false;
      break;
    }
    if (inCommandsSection && line.trim().length > 0) {
      // Example: "  files            Operations on the 'files' resource"
      // Example: "  list             Lists the user's files."
      const match = line.match(/^\s*([a-z0-9+-]+)\s+(.*)$/);
      if (match) {
        const name = match[1];
        const description = match[2].trim();
        if (name === 'help') continue;
        
        if (description.includes("Operations on the") && (description.includes("resource") || description.includes("resources"))) {
          resources.push({
            id: name,
            name,
            description,
            subResources: [], // Lazy load or recursive load
            methods: [],
          });
        } else if (!name.startsWith('+')) { // Ignore helpers like +upload for now
          methods.push({
            id: name,
            name,
            description,
          });
        }
      }
    }
  }

  return { resources, methods };
}

/**
 * Deep discovery for a service.
 */
export function discoverService(serviceId: string): Resource[] {
  const { resources } = getChildren([serviceId]);
  
  for (const resource of resources) {
    deepDiscoverResource([serviceId], resource);
  }
  
  return resources;
}

function deepDiscoverResource(parentParts: string[], resource: Resource) {
  const currentParts = [...parentParts, resource.id];
  const { resources, methods } = getChildren(currentParts);
  
  resource.methods = methods.map(m => m.id);
  resource.subResources = resources;
  
  for (const subResource of resource.subResources) {
    deepDiscoverResource(currentParts, subResource);
  }
}

/**
 * Gets the schema for a specific method.
 * @param methodPath Dot-separated path like 'drive.files.list'
 */
export function getSchema(methodPath: string): any {
  try {
    const output = execSync(`gws schema ${methodPath}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return JSON.parse(output);
  } catch (error) {
    // console.error(`Error fetching schema for ${methodPath}:`, error);
    return null;
  }
}
