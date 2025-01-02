import { faCartShopping, faChevronLeft, faCopy, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, FormGroup, InputGroup, Row } from 'react-bootstrap';
import './App.css';
import ConfirmationModal from './ConfirmationModal';

let generalErrorMessage = (
  <>
    We encountered an unexpected error. Please email <a href="mailto:support@releva.ai">support@releva.ai</a> and we
    will take care of this manually. Apologies for the invonvenience!
  </>
);

const copyText = (elementId) => {
  const element = document.getElementById(elementId);
  if (element && navigator.clipboard) {
    if (element.tagName.toLowerCase() === 'input') {
      navigator.clipboard.writeText(element.value);
    } else {
      navigator.clipboard.writeText(element.textContent);
    }
  }
};

const App = () => {
  const [loyaltyState, setLoyaltyState] = useState();
  const [loadError, setLoadError] = useState();
  const [userError, setUserError] = useState();
  const [selectedCoupon, setSelectedCoupon] = useState();
  const [purchasedCoupon, setPurchasedCoupon] = useState();

  const url = new URL(window.location.href);
  const { p, i, token } = Object.fromEntries(url.searchParams);

  const submit = useCallback(
    (cb) => {
      setUserError(undefined);
      fetch(`${process.env.REACT_APP_RELEVA_BASE_URL}/api/v0/loyalty/${token}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          iv: i,
          encryptedProfileId: p,
          loyaltyCouponId: selectedCoupon,
        }),
      })
        .then((res) => {
          if (res.status === 200) {
            res.json().then(({ coupon }) => {
              setPurchasedCoupon(coupon);
              cb();
            });
          } else {
            res
              .text()
              .then((text) => {
                setUserError(new Error(`Unexpected response code from server: ${res.status} - ${text}!`));
              })
              .catch((e) => setUserError(new Error(`Unexpected error while parsing server response!`)));
          }
        })
        .catch((e) => setUserError(new Error(`Unhandled error: ${e.message}`)));
    },
    [i, token, p, selectedCoupon]
  );

  const loadState = useCallback(async () => {
    setLoyaltyState(undefined);
    if (!token || !p || !i) {
      return;
    }

    const url = new URL(`${process.env.REACT_APP_RELEVA_BASE_URL}/api/v0/loyalty/${token}?p=${p}&i=${i}`);
    try {
      const res = await fetch(url.toString());
      if (res.status !== 200) {
        throw new Error(`Server returned status ${res.status}`);
      } else {
        setLoyaltyState(await res.json());
      }
    } catch (e) {
      setLoadError(generalErrorMessage);
    }
  }, [i, p, token]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  if (loyaltyState === undefined && loadError === undefined) {
    return <div style={{ position: 'fixed', top: '50%', left: '50%' }}>Loading...</div>;
  }

  if (loadError) {
    return (
      <Container>
        <Alert variant="error">{loadError.message}</Alert>{' '}
      </Container>
    );
  }

  return (
    <Container>
      {purchasedCoupon ? (
        <div className="text-center pt-5">
          <h3>Thank you for your purchase! Below is your coupon. Please make sure you copy it or write it down:</h3>
          <FormGroup as={Row}>
            <InputGroup>
              <Form.Control
                size="lg"
                id="accessToken"
                readOnly={true}
                name="accessToken"
                type="text"
                value={purchasedCoupon}
              />
              <Button size="lg" variant="secondary" onClick={() => copyText('accessToken')}>
                <FontAwesomeIcon icon={faCopy} />
              </Button>
            </InputGroup>
          </FormGroup>
          <div className="pt-5">
            <Button
              size="lg"
              variant="primary"
              onClick={() => {
                loadState();
                setPurchasedCoupon(undefined);
              }}
            >
              <FontAwesomeIcon icon={faChevronLeft} /> Go back
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Alert className="mt-3" variant="primary">
            <FontAwesomeIcon icon={faInfoCircle} /> You have {loyaltyState.points.toLocaleString('en-US')} points
            available.
          </Alert>
          {loyaltyState.availableCoupons.length > 0 && (
            <h3 className="text-center mt-5 mb-5">Coupons available for purchase:</h3>
          )}
          {loyaltyState.availableCoupons.map((coupon, i) => {
            return (
              <Col sm={4} key={i}>
                <Card>
                  <Card.Body>
                    <Card.Title>{coupon.title}</Card.Title>
                    <Card.Text className="text-muted">{coupon.description}</Card.Text>
                    <Button
                      variant="primary"
                      disabled={coupon.pointCost > loyaltyState.points}
                      className={coupon.pointCost > loyaltyState.points ? 'disabled' : ''}
                      onClick={() => setSelectedCoupon(coupon.id)}
                    >
                      <FontAwesomeIcon icon={faCartShopping} /> Purchase for {coupon.pointCost.toLocaleString('en-US')}{' '}
                      points
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
          {loyaltyState.availableCoupons.length === 0 && (
            <h5 className="text-center pb-5 pt-5">
              <FontAwesomeIcon icon={faInfoCircle} /> There are no coupons available for purchase at this time. Please
              check back later!
            </h5>
          )}
        </>
      )}

      {userError && <Alert variant="danger">{userError.message}</Alert>}
      <ConfirmationModal
        show={!!selectedCoupon}
        message="Are you sure you would like to proceed with this purchase?"
        close={() => setSelectedCoupon(undefined)}
        confirm={(cb) => submit(cb)}
        error={userError}
      />
    </Container>
  );
};

export default App;
