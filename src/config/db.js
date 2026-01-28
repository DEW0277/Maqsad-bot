const mongoose = require('mongoose');

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
      console.log('🟢 MongoDB ulandi');
      mongoose.set('debug', true);
  })
  .catch((err) => console.log('🔴 MongoDB xato', err));
