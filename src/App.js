import { useCallback, useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Container } from 'react-bootstrap';
import './App.css';

let generalErrorMessage = (
  <>
    We encountered an unexpected error. Please email <a href="mailto:support@releva.ai">support@releva.ai</a> and we
    will take care of this manually. Apologies for the invonvenience!
  </>
);

const App = () => {
  const [loyaltyState, setLoyaltyState] = useState();
  const [loadError, setLoadError] = useState();
  const [userError, setUserError] = useState();

  const url = new URL(window.location.href);
  const { p, i, token } = Object.fromEntries(url.searchParams);

  const submit = useCallback(
    (loyaltyCouponId) => {
      fetch(`${process.env.REACT_APP_RELEVA_BASE_URL}/api/v0/loyalty/${token}`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          iv: i,
          encryptedProfileId: p,
          loyaltyCouponId,
        }),
      })
        .then((res) => {
          if (res.status === 202) {
            // TODO
          } else {
            res
              .text()
              .then((text) => {
                setUserError(`Unexpected response code from server: ${res.status} - ${text}!`);
              })
              .catch((e) => setUserError(`Unexpected error while parsing server response!`));
          }
        })
        .catch((e) => setUserError(`Unhandled error: ${e.message}`));
    },
    [i, token, p]
  );

  useEffect(() => {
    const func = async () => {
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
    };

    func();
  }, [token, p, submit, i]);

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
      <Alert className="mt-3" variant="primary">
        You have {loyaltyState.points.toLocaleString('en-US')} points available.
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
                  onClick={() => submit(coupon.id)}
                >
                  Purchase for {coupon.pointCost.toLocaleString('en-US')} points
                </Button>
              </Card.Body>
            </Card>
          </Col>
        );
      })}
      {loyaltyState.availableCoupons.length === 0 && (
        <h5>There are no coupons available for purchase at this time. Please check back later!</h5>
      )}

      {userError && <Alert variant="danger">{userError.message}</Alert>}
    </Container>
  );
};

export default App;
