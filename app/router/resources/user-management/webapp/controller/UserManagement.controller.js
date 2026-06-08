sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/Button",
  "sap/m/Dialog",
  "sap/m/Input",
  "sap/m/Label",
  "sap/m/MessageBox",
  "sap/m/MessageToast",
  "sap/m/Select",
  "sap/m/VBox",
  "sap/ui/core/Item",
  "p2p/common/Auth",
  "p2p/common/Header"
], function (Controller, JSONModel, Button, Dialog, Input, Label, MessageBox, MessageToast, Select, VBox, Item, Auth, Header) {
  "use strict";

  var SERVICE_PATH = "/odata/v4/p2p";
  var STATUS_OPTIONS = ["Active", "Inactive"];

  return Controller.extend("p2p.usermanagement.controller.UserManagement", {
    onInit: async function () {
      try {
        await Auth.loadSession();
      } catch (error) {
        MessageBox.error(error.message || "Unable to load your BTP user session.");
        return;
      }

      if (!Auth.requireAuth("/user-management/index.html")) {
        return;
      }

      this.getView().setModel(new JSONModel({
        mode: "list",
        users: [],
        selectedUser: null,
        canMutateSelectedUser: false
      }), "admin");

      Header.apply(this, "User Management");
      window.addEventListener("hashchange", this._boundHashChange = function () {
        this._handleHash();
      }.bind(this));
      this._load();
    },

    onExit: function () {
      if (this._boundHashChange) {
        window.removeEventListener("hashchange", this._boundHashChange);
      }
    },

    onRefresh: function () {
      this._load();
    },

    onUserSelectionChange: function (event) {
      this._selectUser(event.getParameter("listItem"));
    },

    onUserRowPress: function (event) {
      var context = event.getSource().getBindingContext("admin");
      var user = context && context.getObject();

      if (user && user.ID) {
        window.location.hash = "#/user/" + encodeURIComponent(user.ID);
      }
    },

    onBackToList: function () {
      window.location.hash = "#/users";
    },

    onAddUser: function () {
      this._openUserDialog("New User", null);
    },

    onEditUser: function () {
      var user = this.getView().getModel("admin").getProperty("/selectedUser");

      if (!user) {
        return MessageBox.error("Select a user first.");
      }

      if (this._isProtectedUser(user)) {
        return MessageBox.error("The admin user cannot be changed.");
      }

      this._openUserDialog("Edit User", user);
    },

    onDeleteUser: function () {
      var user = this.getView().getModel("admin").getProperty("/selectedUser");

      if (!user) {
        return MessageBox.error("Select a user first.");
      }

      if (this._isProtectedUser(user)) {
        return MessageBox.error("The admin user cannot be deleted.");
      }

      MessageBox.confirm("Delete user " + user.userId + "?", {
        actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.DELETE,
        onClose: async function (action) {
          if (action !== MessageBox.Action.DELETE) {
            return;
          }

          await this._request(this._entityKey("Users", user.ID), { method: "DELETE" });
          MessageToast.show("User deleted");
          window.location.hash = "#/users";
          this._load();
        }.bind(this)
      });
    },

    _load: async function (selectedUserId) {
      try {
        var users = await this._read("Users?$orderby=userId");
        var model = this.getView().getModel("admin");

        users = this._decorateUsers(users);
        model.setProperty("/users", users);

        this._handleHash(selectedUserId);
      } catch (error) {
        MessageBox.error(error.message || "User management data could not be loaded.");
      }
    },

    _handleHash: function (fallbackUserId) {
      var hash = window.location.hash || "#/users";
      var match = hash.match(/^#\/user\/(.+)$/);
      var model = this.getView().getModel("admin");

      if (match) {
        model.setProperty("/mode", "object");
        this._applySelection(decodeURIComponent(match[1]));
        return;
      }

      if (fallbackUserId) {
        model.setProperty("/mode", "object");
        window.location.hash = "#/user/" + encodeURIComponent(fallbackUserId);
        this._applySelection(fallbackUserId);
        return;
      }

      model.setProperty("/mode", "list");
      this._applySelection(null);
    },

    _applySelection: function (selectedUserId) {
      var model = this.getView().getModel("admin");
      var users = model.getProperty("/users") || [];
      var selectedUser = selectedUserId ? users.find(function (user) {
        return user.ID === selectedUserId;
      }) : null;

      model.setProperty("/selectedUser", selectedUser || null);
      model.setProperty("/canMutateSelectedUser", !!selectedUser && !this._isProtectedUser(selectedUser));
    },

    _selectUser: function (item) {
      var context = item && item.getBindingContext("admin");
      var user = context && context.getObject();
      var model = this.getView().getModel("admin");

      model.setProperty("/selectedUser", user || null);
      model.setProperty("/canMutateSelectedUser", !!user && !this._isProtectedUser(user));
    },

    _decorateUsers: function (users) {
      return users.map(function (user) {
        return Object.assign({}, user, {
          protected: this._isProtectedUser(user),
          roleSummary: "Managed in BTP"
        });
      }, this);
    },

    _openUserDialog: function (title, user) {
      var isEdit = !!user;
      var inputs = {
        userId: new Input({ value: user && user.userId || "", enabled: !isEdit, placeholder: "for example jsmith" }),
        fullName: new Input({ value: user && user.fullName || "" }),
        email: new Input({ value: user && user.email || "", type: "Email" }),
        companyCode: new Input({ value: user && user.companyCode || "" }),
        costCenter: new Input({ value: user && user.costCenter || "" }),
        language: new Input({ value: user && user.language || "EN", maxLength: 5 }),
        status: this._select(STATUS_OPTIONS, user && user.status || "Active")
      };
      var formItems = [
        this._field("User ID", inputs.userId),
        this._field("Full Name", inputs.fullName),
        this._field("Email", inputs.email),
        this._field("Company Code", inputs.companyCode),
        this._field("Cost Center", inputs.costCenter),
        this._field("Language", inputs.language)
      ];

      formItems.push(this._field("Status", inputs.status));

      var dialog = new Dialog({
        title: title,
        contentWidth: "34rem",
        content: new VBox({
          class: "sapUiSmallMargin p2pDialogForm",
          items: formItems
        }),
        beginButton: new Button({
          text: isEdit ? "Save" : "Create",
          type: "Emphasized",
          press: async function () {
            var payload = {
              userId: inputs.userId.getValue().trim(),
              fullName: inputs.fullName.getValue().trim(),
              email: inputs.email.getValue().trim(),
              companyCode: inputs.companyCode.getValue().trim(),
              costCenter: inputs.costCenter.getValue().trim(),
              language: inputs.language.getValue().trim() || "EN",
              status: inputs.status.getSelectedKey()
            };

            if (!payload.userId || !payload.fullName) {
              return MessageBox.error("User ID and Full Name are required.");
            }

            if (String(payload.userId).toLowerCase() === "admin") {
              return MessageBox.error("The protected admin user cannot be created or changed.");
            }

            var createdUser = await this._request(isEdit ? this._entityKey("Users", user.ID) : SERVICE_PATH + "/Users", {
              method: isEdit ? "PATCH" : "POST",
              body: JSON.stringify(payload)
            });

            dialog.close();
            MessageToast.show(isEdit ? "User updated" : "User created");
            this._load(isEdit ? user.ID : createdUser && createdUser.ID);
          }.bind(this)
        }),
        endButton: new Button({ text: "Cancel", press: function () { dialog.close(); } }),
        afterClose: function () { dialog.destroy(); }
      });

      dialog.open();
    },

    _field: function (label, control) {
      return new VBox({
        renderType: "Bare",
        items: [
          new Label({ text: label, labelFor: control }),
          control
        ]
      });
    },

    _select: function (options, selectedKey) {
      return new Select({
        selectedKey: selectedKey,
        width: "100%",
        items: options.map(function (option) {
          return new Item({ key: option, text: option });
        })
      });
    },

    _read: async function (path) {
      var response = await fetch(SERVICE_PATH + "/" + path);

      if (!response.ok) {
        throw new Error(await this._message(response));
      }

      return (await response.json()).value || [];
    },

    _request: async function (path, options) {
      var response = await fetch(path, Object.assign({
        headers: { "Content-Type": "application/json" }
      }, options));

      if (!response.ok) {
        throw new Error(await this._message(response));
      }

      return response.status === 204 ? null : response.json();
    },

    _message: async function (response) {
      try {
        var body = await response.json();
        return body.error && body.error.message || response.statusText;
      } catch (error) {
        return response.statusText;
      }
    },

    _entityKey: function (entity, id) {
      return SERVICE_PATH + "/" + entity + "(" + encodeURIComponent(id) + ")";
    },

    _isProtectedUser: function (user) {
      return String((user && user.userId) || "").toLowerCase() === "admin";
    }
  });
});
