'use strict';

var _ = require('lodash');
var Q = require('q');
var InstanceContext = require('../../../../../../base/InstanceContext');
var InstanceResource = require('../../../../../../base/InstanceResource');
var Page = require('../../../../../../base/Page');
var values = require('../../../../../../base/values');

var IpAddressPage;
var IpAddressList;
var IpAddressInstance;
var IpAddressContext;

/**
 * Initialize the IpAddressPage
 *
 * :param Version version: Version that contains the resource
 * :param Response response: Response from the API
 * :param accountSid: The account_sid
 * :param ipAccessControlListSid: The ip_access_control_list_sid
 *
 * @returns IpAddressPage
 */
function IpAddressPage(version, response, accountSid, ipAccessControlListSid) {
  Page.prototype.constructor.call(this, version, response);

  // Path Solution
  this._solution = {
    accountSid: accountSid,
    ipAccessControlListSid: ipAccessControlListSid
  };
}

_.extend(IpAddressPage.prototype, Page.prototype);
IpAddressPage.prototype.constructor = IpAddressPage;

/**
 * Build an instance of IpAddressInstance
 *
 * :param dict payload: Payload response from the API
 *
 * @returns IpAddressInstance
 */
IpAddressPage.prototype.getInstance = function getInstance(payload) {
  return new IpAddressInstance(
    this._version,
    payload,
    this._solution.accountSid,
    this._solution.ipAccessControlListSid
  );
};


/**
 * Initialize the IpAddressList
 *
 * :param Version version: Version that contains the resource
 * :param accountSid: The account_sid
 * :param ipAccessControlListSid: The ip_access_control_list_sid
 *
 * @returns IpAddressList
 */
function IpAddressList(version, accountSid, ipAccessControlListSid) {
  function IpAddressListInstance(sid) {
    return IpAddressListInstance.get(sid);
  }

  IpAddressListInstance._version = version;
  // Path Solution
  IpAddressListInstance._solution = {
    accountSid: accountSid,
    ipAccessControlListSid: ipAccessControlListSid
  };
  IpAddressListInstance._uri = _.template(
    '/Accounts/<%= accountSid %>/SIP/IpAccessControlLists/<%= ipAccessControlListSid %>/IpAddresses.json' // jshint ignore:line
  )(IpAddressListInstance._solution);
  /**
   * Streams IpAddressInstance records from the API.
   * This operation lazily loads records as efficiently as possible until the limit
   * is reached.
   * The results are passed into the callback function, so this operation is memory efficient.
   *
   * @param {Function} opts.callback - A callback function to process records
   * @param {number} [opts.limit] -
   *         Upper limit for the number of records to return.
   *         list() guarantees never to return more than limit.
   *         Default is no limit
   * @param {number} [opts.pageSize=50] -
   *         Number of records to fetch per request,
   *         when not set will use the default value of 50 records.
   *         If no pageSize is defined but a limit is defined,
   *         list() will attempt to read the limit with the most efficient
   *         page size, i.e. min(limit, 1000)
   */
  IpAddressListInstance.stream = function stream(opts) {
    if (!(opts && 'callback' in opts)) {
      throw new Error('opts.callback parameter required');
    }

    var currentPage = 1;
    var limits = this._version.readLimits({
      limit: opts.limit,
      pageSize: opts.pageSize
    });

    var deferred = Q.defer();
    function fetchNextPage(fn) {
      var promise = fn();

      promise.then(function(page) {
        if (_.isEmpty(page.instances)) {
          deferred.resolve();
        }

        _.each(page.instances, opts.callback);

        if ((limits.pageLimit && limits.pageLimit <= currentPage)) {
          deferred.resolve();
        } else {
          currentPage++;
          fetchNextPage(_.bind(page.nextPage, page));
        }
      });

      promise.catch(deferred.reject);
    }

    fetchNextPage(_.bind(this.page, this, opts));

    return deferred.promise;
  };

  /**
   * Lists IpAddressInstance records from the API as a list.
   *
   * @param {number} [opts.limit] -
   *         Upper limit for the number of records to return.
   *         list() guarantees never to return more than limit.
   *         Default is no limit
   * @param {number} [opts.pageSize] -
   *         Number of records to fetch per request,
   *         when not set will use the default value of 50 records.
   *         If no page_size is defined but a limit is defined,
   *         list() will attempt to read the limit with the most
   *         efficient page size, i.e. min(limit, 1000)
   *
   * @returns {Array} A list of records
   */
  IpAddressListInstance.list = function list(opts) {
    opts = opts || {};

    var allResources = [];
    opts.callback = function(resource) {
      allResources.push(resource);
    };

    var promise = this.stream(opts);
    promise = promise.then(function() {
      return allResources;
    });

    return promise;
  };

  /**
   * Retrieve a single page of IpAddressInstance records from the API.
   * Request is executed immediately
   *
   * @param {string} [opts.pageToken] - PageToken provided by the API
   * @param {number} [opts.pageNumber] -
   *          Page Number, this value is simply for client state
   * @param {number} [opts.pageSize] - Number of records to return, defaults to 50
   *
   * @returns Page of IpAddressInstance
   */
  IpAddressListInstance.page = function page(opts) {
    opts = opts || {};
    var params = values.of({
      'PageToken': opts.pageToken,
      'Page': opts.pageNumber,
      'PageSize': opts.pageSize
    });

    var promise = version.page(
      'GET',
      this._uri,
      { params: params }
    );

    promise = promise.then(function(response) {
      return new IpAddressPage(
        this._version,
        response,
        this._solution.accountSid,
        this._solution.ipAccessControlListSid
      );
    }.bind(this));

    return promise;
  };

  /**
   * Create a new IpAddressInstance
   *
   * @param string friendlyName - The friendly_name
   * @param string ipAddress - The ip_address
   *
   * @returns Newly created IpAddressInstance
   */
  IpAddressListInstance.create = function create(friendlyName, ipAddress) {
    var data = values.of({
      'FriendlyName': friendlyName,
      'IpAddress': ipAddress
    });

    var promise = this._version.create({
      uri: this._uri,
      method: 'POST',
      data: data,
    });

    promise = promise.then(function(payload) {
      return new IpAddressInstance(
        this._version,
        payload,
        this._solution.accountSid,
        this._solution.ipAccessControlListSid
      );
    }.bind(this));

    return promise;
  };

  /**
   * Constructs a IpAddressContext
   *
   * :param sid - The sid
   *
   * @returns IpAddressContext
   */
  IpAddressListInstance.get = function get(sid) {
    return new IpAddressContext(
      this._version,
      this._solution.accountSid,
      this._solution.ipAccessControlListSid,
      sid
    );
  };

  return IpAddressListInstance;
}


/**
 * Initialize the IpAddressContext
 *
 * @param {Version} version - Version that contains the resource
 * @param {object} payload - The instance payload
 * @param {sid} accountSid: The account_sid
 * @param {sid} ipAccessControlListSid: The ip_access_control_list_sid
 * @param {sid} sid: The sid
 *
 * @returns {IpAddressContext}
 */
function IpAddressInstance(version, payload, accountSid, ipAccessControlListSid,
                            sid) {
  InstanceResource.prototype.constructor.call(this, version);

  // Marshaled Properties
  this._properties = {
    sid: payload.sid, // jshint ignore:line,
    accountSid: payload.account_sid, // jshint ignore:line,
    friendlyName: payload.friendly_name, // jshint ignore:line,
    ipAddress: payload.ip_address, // jshint ignore:line,
    ipAccessControlListSid: payload.ip_access_control_list_sid, // jshint ignore:line,
    dateCreated: payload.date_created, // jshint ignore:line,
    dateUpdated: payload.date_updated, // jshint ignore:line,
    uri: payload.uri, // jshint ignore:line,
  };

  // Context
  this._context = undefined;
  this._solution = {
    accountSid: accountSid,
    ipAccessControlListSid: ipAccessControlListSid,
    sid: sid || this._properties.sid,
  };
}

_.extend(IpAddressInstance.prototype, InstanceResource.prototype);
IpAddressInstance.prototype.constructor = IpAddressInstance;

Object.defineProperty(IpAddressInstance.prototype,
  '_proxy', {
  get: function() {
    if (!this._context) {
      this._context = new IpAddressContext(
        this._version,
        this._solution.accountSid,
        this._solution.ipAccessControlListSid,
        this._solution.sid
      );
    }

    return this._context;
  },
});

Object.defineProperty(IpAddressInstance.prototype,
  'sid', {
  get: function() {
    return this._properties.sid;
  },
});

Object.defineProperty(IpAddressInstance.prototype,
  'accountSid', {
  get: function() {
    return this._properties.accountSid;
  },
});

Object.defineProperty(IpAddressInstance.prototype,
  'friendlyName', {
  get: function() {
    return this._properties.friendlyName;
  },
});

Object.defineProperty(IpAddressInstance.prototype,
  'ipAddress', {
  get: function() {
    return this._properties.ipAddress;
  },
});

Object.defineProperty(IpAddressInstance.prototype,
  'ipAccessControlListSid', {
  get: function() {
    return this._properties.ipAccessControlListSid;
  },
});

Object.defineProperty(IpAddressInstance.prototype,
  'dateCreated', {
  get: function() {
    return this._properties.dateCreated;
  },
});

Object.defineProperty(IpAddressInstance.prototype,
  'dateUpdated', {
  get: function() {
    return this._properties.dateUpdated;
  },
});

Object.defineProperty(IpAddressInstance.prototype,
  'uri', {
  get: function() {
    return this._properties.uri;
  },
});

/**
 * Fetch a IpAddressInstance
 *
 * @returns Fetched IpAddressInstance
 */
IpAddressInstance.prototype.fetch = function fetch() {
  return this._proxy.fetch();
};

/**
 * Update the IpAddressInstance
 *
 * @param string ipAddress - The ip_address
 * @param string friendlyName - The friendly_name
 *
 * @returns Updated IpAddressInstance
 */
IpAddressInstance.prototype.update = function update(ipAddress, friendlyName) {
  return this._proxy.update(
    ipAddress,
    friendlyName
  );
};

/**
 * Deletes the IpAddressInstance
 *
 * @returns true if delete succeeds, false otherwise
 */
IpAddressInstance.prototype.remove = function remove() {
  return this._proxy.remove();
};


/**
 * Initialize the IpAddressContext
 *
 * @param {Version} version - Version that contains the resource
 * @param {sid} accountSid - The account_sid
 * @param {sid} ipAccessControlListSid - The ip_access_control_list_sid
 * @param {sid} sid - The sid
 *
 * @returns {IpAddressContext}
 */
function IpAddressContext(version, accountSid, ipAccessControlListSid, sid) {
  InstanceContext.prototype.constructor.call(this, version);

  // Path Solution
  this._solution = {
    accountSid: accountSid,
    ipAccessControlListSid: ipAccessControlListSid,
    sid: sid,
  };
  this._uri = _.template(
    '/Accounts/<%= accountSid %>/SIP/IpAccessControlLists/<%= ipAccessControlListSid %>/IpAddresses/<%= sid %>.json' // jshint ignore:line
  )(this._solution);
}

_.extend(IpAddressContext.prototype, InstanceContext.prototype);
IpAddressContext.prototype.constructor = IpAddressContext;

/**
 * Fetch a IpAddressInstance
 *
 * @returns Fetched IpAddressInstance
 */
IpAddressContext.prototype.fetch = function fetch() {
  var params = values.of({});

  var promise = this._version.fetch({
    method: 'GET',
    uri: this._uri,
    params: params,
  });

  promise = promise.then(function(payload) {
    return new IpAddressInstance(
      this._version,
      payload,
      this._solution.accountSid,
      this._solution.ipAccessControlListSid,
      this._solution.sid
    );
  }.bind(this));

  return promise;
};

/**
 * Update the IpAddressInstance
 *
 * @param string ipAddress - The ip_address
 * @param string friendlyName - The friendly_name
 *
 * @returns Updated IpAddressInstance
 */
IpAddressContext.prototype.update = function update(ipAddress, friendlyName) {
  var data = values.of({
    'IpAddress': ipAddress,
    'FriendlyName': friendlyName,
  });

  var promise = this._version.update({
    uri: this._uri,
    method: 'POST',
    data: data,
  });

  promise = promise.then(function(payload) {
    return new IpAddressInstance(
      this.version,
      payload,
      this._solution.accountSid,
      this._solution.ipAccessControlListSid,
      this._solution.sid
    );
  }.bind(this));

  return promise;
};

/**
 * Deletes the IpAddressInstance
 *
 * @returns true if delete succeeds, false otherwise
 */
IpAddressContext.prototype.remove = function remove() {
  return this._version.remove({
    method: 'DELETE',
    uri: this._uri
  });
};

module.exports = {
  IpAddressPage: IpAddressPage,
  IpAddressList: IpAddressList,
  IpAddressInstance: IpAddressInstance,
  IpAddressContext: IpAddressContext
};