const Listing = require('./models/listing');
const STATUSES = ['Interested', 'Toured', 'Applied', 'Rejected'];
const UTM = 'utm_source=household&utm_medium=referral';

module.exports = function (app, passport) {

  // helper function to load property images ===============================================================

  function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) return next();
    res.redirect('/');
  }

  async function pickImage(userUrl) {
    if (userUrl && /^https?:\/\//i.test(userUrl)) return { imageUrl: userUrl };
    const auth = { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` };
    try {
      const r = await fetch(
        'https://api.unsplash.com/search/photos?query=apartment%20interior&per_page=20&orientation=landscape',
        { headers: auth }
      );
      const data = await r.json();
      const p = data.results[Math.floor(Math.random() * data.results.length)];

      // Unsplash asks apps to report when a photo gets used
      fetch(p.links.download_location, { headers: auth }).catch(() => { });

      return {
        imageUrl: p.urls.regular,
        imageCredit: p.user.name,
        imageCreditUrl: `${p.user.links.html}?${UTM}`
      };
    } catch (err) {
      console.error('Unsplash failed', err);
      return {};
    }
  }

  // pages ===============================================================

  // show the home page (will also have our login links)
  app.get('/', function (req, res) {
    res.render('index.ejs');
  });

  // LOGOUT ==============================
  app.get('/logout', function (req, res) {
    req.logout(() => {
      console.log('User has logged out!')
    });
    res.redirect('/');
  });

  // listing routes ===============================================================

  //loading listings
  app.get('/listings', isLoggedIn, async (req, res) => {
    try {
      const filter = { userId: req.user._id };
      const activeStatus = STATUSES.includes(req.query.status) ? req.query.status : 'all';
      if (activeStatus !== 'all') filter.status = activeStatus;

      const listings = await Listing.find(filter).sort({ createdAt: -1 });
      res.render('listings.ejs', { user: req.user, listings, activeStatus });
    } catch (err) {
      console.error(err);
      res.status(500).send('Something went wrong loading your listings.');
    }
  });

  // saving a listing
  app.post('/listings', isLoggedIn, async (req, res) => {
    try {
      await Listing.create({
        userId: req.user._id,
        address: req.body.address,
        rent: req.body.rent,
        bedrooms: req.body.bedrooms,
        link: req.body.link,
        notes: req.body.notes,
        ...(await pickImage(req.body.imageUrl))
      });
      res.redirect('/listings');
    } catch (err) {
      console.error(err);
      res.status(500).send('Could not save that listing.');
    }
  });

  // show edit form
  app.get('/listings/:id/edit', isLoggedIn, async (req, res) => {
    try {
      const listing = await Listing.findOne({ _id: req.params.id, userId: req.user._id });
      if (!listing) return res.status(404).send('Listing not found.');
      res.render('edit.ejs', { user: req.user, listing });
    } catch (err) {
      console.error(err);
      res.status(500).send('Could not load that listing.');
    }
  });

  // save edits
  app.post('/listings/:id/edit', isLoggedIn, async (req, res) => {
    try {
      const updated = await Listing.findOneAndUpdate(
        { _id: req.params.id, userId: req.user._id },
        {
          address: req.body.address,
          rent: req.body.rent,
          bedrooms: req.body.bedrooms,
          link: req.body.link,
          notes: req.body.notes,
          status: req.body.status
        },
        { runValidators: true }
      );
      if (!updated) return res.status(404).send('Listing not found.');
      res.redirect('/listings');
    } catch (err) {
      console.error(err);
      res.status(500).send('Could not update that listing.');
    }
  });

  // deleting listing
  app.post('/listings/:id/delete', isLoggedIn, async (req, res) => {
    try {
      const deleted = await Listing.findOneAndDelete({
        _id: req.params.id,
        userId: req.user._id
      })

      if (!deleted) {
        return res.status(404).send('Listing not found.')
      }
      res.redirect('/listings');
    } catch (err) {
      console.error(err);
      res.status(500).send('Could not delete that listing.');
    }
  });

  // =============================================================================
  // AUTHENTICATE (FIRST LOGIN) ==================================================
  // =============================================================================

  // locally --------------------------------
  // LOGIN ===============================
  // show the login form
  app.get('/login', function (req, res) {
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/listings', // redirect to the listings
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  // SIGNUP =================================
  // show the signup form
  app.get('/signup', function (req, res) {
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/listings', // redirect to the listings
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}
