module.exports = {
    get500: (err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return err;
    },
    backtoIndex: (req, rex) => {
        req.flash('error', err);
        return res.redirect('/');
    },
    response:(res ,res_data) => {        
        res.status(200).json({
            isresponse: 1,
            res_time: Date(),
            res_id: 'TEMPID002',
            res_data
        });
    }
};