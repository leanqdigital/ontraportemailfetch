var axios = require("axios");
var dotenv = require("dotenv");
const express = require("express");
const app = express();
const cors = require("cors");
const morgan = require("morgan");

dotenv.config();
var getEmailUrl = "https://api.ontraport.com/1/object/getByEmail";
var getContactUrl = "https://api.ontraport.com/1/Contacts";
const corsOptions = {
  origin: [
    "https://members.awardee.com.au",
  ],
};

app.use(morgan("dev"));
app.use(cors("*"));
var headers = {
  "Api-Appid": process.env.API_APPID,
  "Api-Key": process.env.API_KEY,
};
var fetchContactId = function (email) {
  var params = {
    objectID: 0,
    email: email,
    all: 0,
  };
  var url = getEmailUrl + "?" + new URLSearchParams(params);
  return axios(url, {
    method: "GET",
    headers: headers,
  })
    .then(function (response) {
      if (response.status !== 200) {
        throw new Error(
          `Network response was not ok: ${response.status} ${response.statusText}`
        );
      }
      console.log(response.data);
      console.log(response);
      return response.data;
    })
    .then(function (data) {
      if (data && data.data && data.data.id) {
        return data.data.id;
      } else {
        throw new Error("Contact ID not found");
      }
    })
    .catch(function (error) {
      throw new Error(`Error fetching contact ID: ${error.message}`);
    });
};
var fetchContactDetailsById = function (contactId) {
  var params = {
    ids: contactId,
  };
  var url = getContactUrl + "?" + new URLSearchParams(params);
  return axios(url, {
    method: "GET",
    headers: headers,
  })
    .then(function (response) {
      if (response.status !== 200) {
        throw new Error(
          `Network response was not ok: ${response.status} ${response.statusText}`
        );
      }
      console.log(response);
      return response.data;
    })
    .then(function (data) {
      console.log(data);
      if (data && data.data && data.data.length > 0) {
        var email = data.data[0].email;
        var firstname = data.data[0].firstname;
        var lastname = data.data[0].lastname;
        var headOffice = data.data[0].f2036;
        return { email: email, firstname: firstname, lastname: lastname, headOffice: headOffice };
      } else {
        throw new Error("Contact details not found");
      }
    })
    .catch(function (error) {
      throw new Error(`Error fetching contact details: ${error.message}`);
    });
};
var fetchContactDetailsByEmail = function (email) {
  return fetchContactId(email)
    .then(function (contactId) {
      return fetchContactDetailsById(contactId);
    })
    .catch(function (error) {
      throw new Error(
        `Error fetching contact details by email: ${error.message}`
      );
    });
};
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", async function (req, res) {
  let email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const contactDetails = await fetchContactDetailsByEmail(email);
    res.status(200).json(contactDetails);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});


app.get("/head-office", async function(req,res) {
  let email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const contactDetails = await fetchContactDetailsByEmail(email);
    res.status(200).json({headOffice: contactDetails.headOffice});
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
})
app.listen(function (err) {
  if (err) {
    console.error("Error starting server:", err);
  } else {
    console.log("Listening on port 3002");
  }
});
