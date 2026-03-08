import { getServices, getChildren, discoverService } from './gws-discovery';

console.log("--- Services ---");
const services = getServices();
console.log(JSON.stringify(services, null, 2));

if (services.length > 0) {
  const firstService = services[0].id;
  console.log(`\n--- Children of ${firstService} ---`);
  const children = getChildren([firstService]);
  console.log(JSON.stringify(children, null, 2));
  
  // Test deep discovery for a small service if possible, or just drive
  console.log(`\n--- Deep discovery for drive ---`);
  const driveResources = discoverService('drive');
  // Only show first level of drive resources for brevity
  console.log(JSON.stringify(driveResources.map(r => ({ id: r.id, methods: r.methods })), null, 2));

  console.log(`\n--- Deep discovery for gmail ---`);
  const gmailResources = discoverService('gmail');
  // Check if gmail.users has sub-resources
  console.log(JSON.stringify(gmailResources, (key, value) => {
    if (key === 'description') return undefined; // Hide descriptions for brevity
    return value;
  }, 2));
}
