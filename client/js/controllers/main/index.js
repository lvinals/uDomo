import { inject, controller } from 'ng-annotations';

@controller('ControllerMain')
@inject(
  '$rootScope',
  '$location',
  '$scope',
  'FactoryStorage',
  'FactoryMain',
  'FactoryUser',
  'FactoryCommon',
  'FactoryBackup'
)
export default class {
  constructor($rootScope, $location, scope, Storage, Main, User, Common, Backup) { //eslint-disable-line
    this.rootScope = $rootScope;
    this.location = $location;
    this.scope = scope;
    this.Storage = Storage;
    this.Main = Main;
    this.User = User;
    this.Common = Common;
    this.Backup = Backup;
    /**
     * Set the token globaly
     */
    this.rootScope.Token = this.Storage.getToken();
    /**
     * Clean exit
     */
    this.scope.$on('$destroy', () => this.Main.ClearListeners());
  }

  Login(user) {
    this.User.Login(user, (errorCB, resUser) => {
      if (resUser) {
        this.user = '';
        Storage.setToken(resUser.Token);
        this.location.path('/');
      }
    });
  }

  CreateUser(user) {
    user._id = this.Common.newID();
    user.Permissions = { 'Administrador': true };
    this.User.CreateUser(user, (errorcb, resUser) => {
      if (resUser && !errorcb) {
        Storage.setToken(resUser.Token);
        this.location.path('/');
      }
    });
  }

  Logout() {
    this.User.Logout();
    /**
     * Should be in users?
     */
    Storage.deleteToken();
    this.location.path('/');
  }

  GetBackups() {
    return this.Backup.getAll((errorCB, backups) => {
      this.currentBackups = backups;
    });
  }
}
