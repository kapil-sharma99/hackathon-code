const express = require('express');
const db = require("../config/database");
const { v4: uuidv4 } = require('uuid');

const app = express();
const newUuid = uuidv4();
const PORT = 3000;

//middleware to parse json
app.use(express.json());

//Defining a port route to create consent in db, return consent parameters and handle.
app.post('/consent/create', async (req, res) => {
    const {mobileNumber, templateId} = req.body;
    try {
        const row = await db.query("SELECT * FROM consent_templates WHERE template_id = ? LIMIT 1", [templateId]);
        if(row == null) {
            return res.status(404).json({message: "No template found!"});
        }
				//consent from and to date logic
				let consentExpiryDiff = row.consent_to - row.consent_from;
				let consentStartDateTime = new Date();
				let consentEndDateTime = new Date(consentStartDateTime.getTime() + consentExpiryDiff);

				//fiDataRange from and to logic
				let fiDataRangeDiff = row.data_range_to - row.data_range_from;
				let fiDataRangeTo = new Date();
				let fiDataRangeFrom = new Date(fiDataRangeTo.getTime() + fiDataRangeDiff);

				consentBody = {
					"org_id": "AA",
					"consent_id": null,
					"consent_handle": newUuid,
					"status": "ACTIVE",
					"consent_start": consentStartDateTime.toISOString(),
					"consent_end": consentEndDateTime.toISOString(),
					"consent_mode": row.consent_mode,
					"fetch_type": row.fetch_type,
					"consent_types": row.consent_type.split(","),
					"fi_types": row.fi_types.split(","),
					"data_consumer_id": "EqualProd",
					"data_consumer_type": "DC1",
					"customer_id": mobileNumber + "@onemoney",
					"customer_identifier": "MOBILE",
					"purpose_code": row.purpose_code,
					"purpose_ref_uri": row.purpose_ref_uri,
					"purpose_text": row.purpose_text,
					"purpose_category_type": row.purpose_category_type,
					"fi_data_from": fiDataRangeFrom.toISOString(),
					"fi_data_to": fiDataRangeTo.toISOString(),
					"data_life_unit": row.data_life_unit,
					"data_life_value": row.data_life_value,
					"frequency_unit": row.frequency_unit,
					"frequency_value": row.frequency_value,
					"data_filter": JSON.parse(row.data_filter),
					"last_updated_timestamp": new Date(),
					"user_id": mobileNumber
				};

				const sql = `
					INSERT INTO consent_requests (
						org_id, consent_id, consent_handle, status, consent_start, consent_end, 
						consent_mode, fetch_type, consent_types, fi_types, data_consumer_id, 
						data_consumer_type, customer_id, customer_identifier, purpose_code, 
						purpose_ref_uri, purpose_text, purpose_category_type, fi_data_from, 
						fi_data_to, data_life_unit, data_life_value, frequency_unit, 
						frequency_value, data_filter, last_updated_timestamp, user_id
					) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
				`;

				const values = [
					consentBody.org_id,
					consentBody.consent_id,
					consentBody.consent_handle,
					consentBody.status,
					consentBody.consent_start,
					consentBody.consent_end,
					consentBody.consent_mode,
					consentBody.fetch_type,
					consentBody.consent_types,
					consentBody.fi_types,
					consentBody.data_consumer_id,
					consentBody.data_consumer_type,
					consentBody.customer_id,
					consentBody.customer_identifier,
					consentBody.purpose_code,
					consentBody.purpose_ref_uri,
					consentBody.purpose_text,
					consentBody.purpose_category_type,
					consentBody.fi_data_from,
					consentBody.fi_data_to,
					consentBody.data_life_unit,
					consentBody.data_life_value,
					consentBody.frequency_unit,
					consentBody.frequency_value,
					consentBody.data_filter,
					consentBody.last_updated_timestamp,
					consentBody.user_id
				];

				const [result] = await db.execute(sql, values);
    		console.log("Consent request inserted with ID:", result.insertId);

        res.status(200).json({
            message: "Data fetched!!",
            data: consentBody,
        });
    }catch(exception) {
        console.log("Exception occurred in /consent/create api: ", exception);
        res.status(500).json({message: 'Error while creating the consent: ', exception: exception.message});
    } finally {
			db.end();
		}
});

app.post('/consent/update', async (req, res) => {
	const {consentHandle, status} = req.body;
	try {
		const sql = `
      UPDATE consent_template 
      SET status = ? 
      WHERE consent_handle = ?
    `;

		const values = [status, consentHandle];
		const [result] = await db.execute(sql, values);
		if(result.affectedRows > 0) {
			console.log("Status updated");
			res.status(200).json({message: "Consent updated", data: null});
		} else {
			console.log("Failed to update the consent");
			res.status(404).json({message: "No consent found for update", data: null});
		}

	} catch(exception) {
		console.log("Exception occurred in /consent/update api: ", exception);
		res.status(500).json({message: 'Error while updating the consent status', exception: exception.message});
	} finally {
		db.end();
	}
});

app.post('fi/fetch/analyzed', async (req, res) => {
	const consentHandle = req.body.consentHandle;
	try {
		const sql = `
			SELECT * FROM fi_data 
			WHERE consent_handle = ?
			LIMIT 1
		`;

		const [result] = await db.execute(sql, consentHandle);
		if(result == null) {
			console.log("Data not found");
			res.status(404).json({message: "Data not found!!", data: null});
		} else {
			res.status(200).json({message: "Analyzed FI Data", data: result});
		}
	} catch(exception) {
		console.log("Exception occurred in /fi/fetch/analyzed api: ", exception);
		res.status(500).json({message: "Error while fetching the analyzed fi data", exception: exception.message});
	}
});

app.listen(PORT, () => {
    console.log('Server is running');
});