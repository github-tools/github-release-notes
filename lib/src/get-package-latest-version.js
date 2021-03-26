const https = require('https');

const packageName = process.argv[2];
const url = `https://registry.npmjs.org/-/package/${packageName}/dist-tags`;
https.get(url, res => {
    const buffers = [];
    res.on('data', (data) => {
        buffers.push(data);
    }).on('end', () => {
        const result = [];
        if (res.statusCode !== 200) {
            result.push(`url: ${url}; statusCode: ${res.statusCode}`);
        } else {
            const { latest } = JSON.parse(Buffer.concat(buffers).toString());
            result.push(null, latest);
        }
        process.stdout.write(JSON.stringify(result));
    });
});
