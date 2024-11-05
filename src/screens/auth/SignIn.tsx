import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  FormControl,
  Text,
  VStack,
  Center,
  Alert,
  AlertIcon,
  Stack,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import CommonButton from "../../components/common/button/Button";
import Layout from "../../components/common/layout/Layout";
import FloatingInput from "../../components/common/input/Input";
import FloatingPasswordInput from "../../components/common/input/PasswordInput";
import {
  loginUser,
  getUser,
  getDocumentsList,
  sendConsent,
} from "../../services/auth/auth";
import { getTokenData, saveToken } from "../../services/auth/asyncStorage";
import { AuthContext } from "../../utils/context/checkToken";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import { useTranslation } from "react-i18next";

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [dialogVisible, setDialogVisible] = useState(false);

  const { checkToken, documents, updateUserData, userData } =
    useContext(AuthContext);

  useEffect(() => {
    // Check for empty fields
    const isValid = username.trim() !== "" && password.trim() !== "";

    // Set form validity
    setIsFormValid(isValid);
  }, [username, password]);

  const handleLogin = async () => {
    // Clear error after 3 seconds
    const clearError = () => {
      setTimeout(() => {
        setError("");
      }, 3000);
    };

    try {
      setLoading(true); // Show loading indicator
      const response = await loginUser({ username, password });
      setLoading(false); // Hide loading indicator after response
      saveToken(response.data.access_token, response.data.refresh_token);
      init();
      setDialogVisible(true);
    } catch (error) {
      setLoading(false); // Hide loading indicator
      if (error.error === "INVALID_USERNAME_PASSWORD_MESSAGE") {
        setError("Invalid username or password");
      } else {
        setError(error.message);
      }
      clearError();
    }
  };

  const init = async () => {
    try {
      const { sub } = await getTokenData(); // Assuming sub is the user identifier
      const result = await getUser(sub);
      const data = await getDocumentsList();
      updateUserData(result?.data, data?.data);
      setLoading(false);
    } catch (error) {
      console.log("Error fetching user data or documents:", error.message);
      setLoading(false);
    }
  };

  const handleCofirmation = async () => {
    try {
      await sendConsent(userData?.user_id);
      checkToken();
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <Layout
      isMenu={false}
      _heading={{
        heading: "Sign In with E-Wallet",
        handleBack,
      }}
      isBottombar={false}
    >
      <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
        <VStack align="stretch">
          <FormControl>
            <FloatingInput
              label="User Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              isInvalid={username.trim() === ""}
              errorMessage={t("SIGNIN_USER_NAME_IS_REQUIRED")}
            />
            <FloatingPasswordInput
              label="Create Password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              isInvalid={password.trim() === ""}
              errorMessage={t("SIGNIN_PASSWORD_IS_REQUIRED")}
            />
          </FormControl>
          <CommonButton
            isDisabled={!isFormValid || loading}
            onClick={handleLogin}
            label="Sign In"
          />
          <Stack mt={4}>
            {error && (
              <Alert status="error" variant="solid">
                <AlertIcon />
                {error}
              </Alert>
            )}
          </Stack>
        </VStack>
        <ConfirmationDialog
          loading={loading}
          dialogVisible={dialogVisible}
          closeDialog={setDialogVisible}
          handleConfirmation={handleCofirmation}
          documents={documents}
          concentText="Please provide your consent to share the following with Fast Pass"
        />
        <Center>
          <Text mt={6}>
            {t("SIGNIN_DONT_HAVE_AN_ACCOUNT")}
            <Link to="/signup" className="text-color text-decoration-underline">
              {t("SIGNUP_SIGN_UP")}
            </Link>
          </Text>
        </Center>
      </Box>
    </Layout>
  );
};

export default SignIn;
