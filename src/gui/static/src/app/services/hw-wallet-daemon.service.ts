import { Injectable, NgZone } from '@angular/core';
import { ApiService } from './api.service';
import { Http, RequestOptions, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { HwWalletPinService } from './hw-wallet-pin.service';
import { HwWalletSeedWordService } from './hw-wallet-seed-word.service';
import { ISubscription } from 'rxjs/Subscription';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/timeout';
import { AppConfig } from '../app.config';

@Injectable()
export class HwWalletDaemonService {

  public static readonly errorCancelled = 'Cancelled';
  public static readonly errorConnectingWithTheDaemon = 'Error connecting with the hw wallet service';
  public static readonly errorTimeout = 'The operation was cancelled due to inactivity';
  private readonly url = 'http://127.0.0.1:9510/api/v1';

  private checkHwSubscription: ISubscription;
  private hwConnected = false;
  private connectionEventSubject = new BehaviorSubject<boolean>(false);

  get connectionEvent() {
    return this.connectionEventSubject.asObservable();
  }

  constructor(
    private http: Http,
    private apiService: ApiService,
    private hwWalletPinService: HwWalletPinService,
    private hwWalletSeedWordService: HwWalletSeedWordService,
    private ngZone: NgZone,
  ) { }

  get(route: string) {
    return this.checkResponse(this.http.get(
      this.url + route,
      this.returnRequestOptions(),
    ), route.includes('/available'));
  }

  post(route: string, params = {}, sendFormData = false) {
    return this.checkResponse(this.http.post(
      this.url + route,
      !sendFormData ? JSON.stringify(params) : this.apiService.getQueryString(params),
      this.returnRequestOptions(sendFormData, false),
    ));
  }

  put(route: string, params: any = null, sendMultipartFormData = false, smallTimeout = false) {
    return this.checkResponse(this.http.put(
      this.url + route,
      params,
      this.returnRequestOptions(false, sendMultipartFormData),
    ), false, smallTimeout);
  }

  delete(route: string) {
    return this.checkResponse(this.http.delete(
      this.url + route,
      this.returnRequestOptions(),
    ));
  }

  private checkResponse(response: Observable<any>, checkingConnected = false, smallTimeout = false) {
    return response
      .timeout(smallTimeout ? 5000 : 50000)
      .flatMap((res: any) => {
        const finalResponse = res.json();

        if (checkingConnected) {
          this.ngZone.run(() => this.updateHwConnected(!!finalResponse.data));
        } else {
          this.updateHwConnected(true);
        }

        if (typeof finalResponse.data === 'string' && (finalResponse.data as string).indexOf('PinMatrixRequest') !== -1) {
          return this.hwWalletPinService.requestPin().flatMap(pin => {
            if (!pin) {
              return this.put('/cancel').map(() => HwWalletDaemonService.errorCancelled);
            }

            return this.post('/intermediate/pin_matrix', {pin: pin});
          });
        }

        if (typeof finalResponse.data === 'string' && (finalResponse.data as string).indexOf('WordRequest') !== -1) {
          return this.hwWalletSeedWordService.requestWord().flatMap(word => {
            if (!word) {
              return this.put('/cancel').map(() => HwWalletDaemonService.errorCancelled);
            }

            return this.post('/intermediate/word', {word: word});
          });
        }

        return Observable.of(finalResponse);
      })
      .catch((error: any) => {
        if (error && error.name && error.name === 'TimeoutError') {
          this.put('/cancel').map(() => HwWalletDaemonService.errorCancelled).subscribe();

          return Observable.throw({_body: HwWalletDaemonService.errorTimeout });
        }

        if (error && error._body)  {
          let errorContent: string;

          if (error._body.error)  {
            errorContent = error._body.error;
          } else {
            try {
              errorContent = JSON.parse(error._body).error;
            } catch (e) {}
          }

          if (errorContent) {
            return this.apiService.processConnectionError(error, true);
          }
        }

        return Observable.throw({_body: HwWalletDaemonService.errorConnectingWithTheDaemon });
      });
  }

  private returnRequestOptions(sendFormData = false, sendMultipartFormData = false) {
    const options = new RequestOptions();
    options.headers = new Headers();
    if (!sendMultipartFormData) {
      options.headers.append('Content-Type', !sendFormData ? 'application/json' : 'application/x-www-form-urlencoded');
    }

    return options;
  }

  checkHw(wait: boolean) {
    if (this.checkHwSubscription) {
      this.checkHwSubscription.unsubscribe();
    }

    this.ngZone.runOutsideAngular(() => {
      this.checkHwSubscription = Observable.of(1)
        .delay(wait ? (this.hwConnected ? 2000 : 10000) : 0)
        .flatMap(() => this.get('/available'))
        .subscribe(
          null,
          () => this.ngZone.run(() => this.updateHwConnected(false)),
        );
    });
  }

  private updateHwConnected(connected: boolean) {
    if (connected && !this.hwConnected) {
      this.hwConnected = true;
      this.connectionEventSubject.next(this.hwConnected);
    } else if (!connected && this.hwConnected) {
      this.hwConnected = false;
      this.connectionEventSubject.next(this.hwConnected);
    }
    this.checkHw(true);
  }

}
