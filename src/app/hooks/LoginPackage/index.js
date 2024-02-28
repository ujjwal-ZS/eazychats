import React, { useEffect, useState, Fragment } from "react";
import Loader from "../Loader";

function useAuth(
  tokenStorage,
  baseUrl,
  loginEndPoint,
  refreshEndPoint,
  providers,
  theme = "",
  tenantID,
  createOrgCallback = () => {}
) {
  let interval;

  const [isLoading, setIsLoading] = useState(false);

  const loginApi = async (token) => {
    const reqBody = {
      provider: "GOOGLE",
      providerData: { token },
      platform: "WEB",
    };

    const response = await fetch(`${baseUrl}${loginEndPoint}`, {
      method: "POST",
      body: JSON.stringify(reqBody),
    });

    const res = await response.json();
    if (res.data) {
      localStorage.setItem(
        tokenStorage,
        JSON.stringify({
          refreshToken: res.data.refreshToken,
          tenants: res.data.tenants,
        })
      );
      return res.data;
    } else {
      throw new Error("Login API error");
    }
  };

  const refreshApi = async (
    refreshToken = "",
    tenantID,
    onSuccess = () => {}
  ) => {
    const refreshReqBody = {
      refreshToken:
        refreshToken ||
        JSON.parse(localStorage.getItem(tokenStorage)).refreshToken,
      tenantID,
    };
    const refreshResponse = await fetch(`${baseUrl}${refreshEndPoint}`, {
      method: "POST",
      body: JSON.stringify(refreshReqBody),
    });

    const refreshData = await refreshResponse.json();
    const existingTokenStorage =
      JSON.parse(localStorage.getItem(tokenStorage)) || {};
    localStorage.setItem(
      tokenStorage,
      JSON.stringify({
        ...existingTokenStorage,
        accessToken: refreshData.data.accessToken,
      })
    );
    onSuccess(localStorage.getItem(tokenStorage));
  };

  const handleCredentialResponse = (response, onSuccess) => {
    const token = response.credential;
    setIsLoading(true);
    loginApi(token)
      .then(async (loginData) => {
        if (!loginData?.tenants?.length) {
          createOrgCallback(loginData?.refreshToken);
          return;
        }
        await refreshApi(
          loginData.refreshToken,
          loginData.tenants[0].id,
          onSuccess
        );
      })
      .catch((error) => {
        console.error("API error:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (localStorage.getItem(tokenStorage)) {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      interval = setInterval(() => {
        async function refreshData() {
          const storedData = JSON.parse(localStorage.getItem(tokenStorage));
          try {
            await refreshApi(
              storedData.refreshToken,
              tenantID || storedData.tenants[0].id,
              providers?.[0]?.onSuccess
            );
          } catch (e) {
            logout();
          }
        }
        refreshData();
      }, 270000);
    }
    return () => clearInterval(interval);
  }, [localStorage.getItem(tokenStorage), isLoading]);

  const login = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      providers.forEach((provider) => {
        if (
          window.google !== undefined &&
          window.google.accounts !== undefined
        ) {
          window.google.accounts.id.initialize({
            client_id: provider.authClientID,
            callback: (response) => {
              handleCredentialResponse(response, provider.onSuccess);
            },
          });
          window.google.accounts.id.renderButton(
            document.getElementById("google-signin"),
            {
              theme: theme ? theme : "filled_blue",
              size: "large",
              type: "standard",
              width: window.innerWidth <= 960 ? 200 : 300,
              text: "Signin with Google",
              logo_alignment: "left",
              auto_select: "true",
            }
          );
        }
      });
    }, []);
    return (
      <div>
        {providers.map((provider, index) => (
          <div key={index}>
            {isLoading ? (
              <Loader size="50px" />
            ) : (
              <Fragment>
                {provider.name === "Google" && <div id="google-signin" />}
              </Fragment>
            )}
          </div>
        ))}
      </div>
    );
  };

  const logout = () => {
    localStorage.removeItem(tokenStorage);
    clearInterval(interval);
  };
  if (typeof window === "undefined") return {};
  return { login, logout, refreshApi };
}

export { useAuth };
