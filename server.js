const { app, http } = require('./public/app');
const PORT = process.env.PORT || 7001;

http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
